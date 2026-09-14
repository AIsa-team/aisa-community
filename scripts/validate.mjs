#!/usr/bin/env node
/**
 * Validates every project submission in projects/, plus competition files.
 *
 * Checks:
 *  - project.yaml parses as YAML and matches schemas/project.schema.json
 *  - slug matches the folder name; slugs are unique across the registry
 *  - declared AIsa endpoints are real endpoints, not plain model/LLM calls
 *  - no obvious secrets committed (API keys, private keys, tokens)
 *  - competitions/<cycle>/winners.yaml: valid podium (unique places 1-3),
 *    every winner exists in projects/
 *
 * Exit code 0 = all good, 1 = validation errors (printed to stderr).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_FILE_BYTES = 1 * 1024 * 1024;

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------------------------------------------------------------- schemas
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const loadSchema = (name) =>
  ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", name), "utf8")));

const validateProject = loadSchema("project.schema.json");
const validateWinners = loadSchema("winners.schema.json");

// ---------------------------------------------------------------- helpers
function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

function readYaml(file) {
  try {
    return yaml.load(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(`${path.relative(ROOT, file)}: YAML parse error — ${e.message.split("\n")[0]}`);
    return null;
  }
}

function schemaErrors(validate, data, label) {
  if (validate(data)) return;
  for (const e of validate.errors ?? []) {
    err(`${label}: ${e.instancePath || "(root)"} ${e.message}`);
  }
}

function* walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      yield* walkFiles(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

// Best-effort secret detection. Deliberately high-precision patterns only.
const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/ghp_[A-Za-z0-9]{36}/, "GitHub personal access token"],
  [/github_pat_[A-Za-z0-9_]{22,}/, "GitHub fine-grained token"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/sk-[A-Za-z0-9_-]{20,}/, "secret API key (sk-...)"],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, "private key material"],
  [/AIza[0-9A-Za-z_-]{35}/, "Google API key"],
];

// Values that are obviously NOT a qualifying AIsa endpoint — every submission
// must use at least one AIsa endpoint beyond plain model/LLM calls (see
// CONTRIBUTING.md). This is a floor; reviewers verify the project actually
// calls what is declared.
const NON_QUALIFYING_ENDPOINT = /^(none|n\/?a|-|llm|model|models?\/.*|chat|completions?|chat\/completions?|plain model call|prompt|gpt|claude)$/i;

// ---------------------------------------------------------------- submissions
const seenSlugs = new Map(); // slug -> where
const projectSlugs = new Set();

function checkSubmission(dir) {
  const folder = path.join(ROOT, "projects", dir);
  const metaPath = path.join(folder, "project.yaml");
  const relFolder = path.relative(ROOT, folder);

  if (!fs.existsSync(metaPath)) {
    err(`${relFolder}: missing project.yaml`);
    return;
  }
  const meta = readYaml(metaPath);
  if (!meta) return;

  schemaErrors(validateProject, meta, `${relFolder}/project.yaml`);

  // Endpoint eligibility: declared endpoints must be real AIsa endpoints,
  // not plain model/LLM calls.
  for (const ep of meta.aisa_endpoints_used ?? []) {
    if (typeof ep === "string" && NON_QUALIFYING_ENDPOINT.test(ep.trim())) {
      err(`${relFolder}/project.yaml: aisa_endpoints_used entry "${ep}" is not a qualifying AIsa endpoint — submissions must use at least one endpoint beyond plain model calls (e.g. stock/prices, search/web); see CONTRIBUTING.md`);
    }
  }

  if (meta.slug && meta.slug !== dir) {
    err(`${relFolder}: slug "${meta.slug}" does not match folder name "${dir}"`);
  }
  if (meta.slug) {
    if (seenSlugs.has(meta.slug)) {
      err(`${relFolder}: duplicate slug "${meta.slug}" (also used by ${seenSlugs.get(meta.slug)})`);
    } else {
      seenSlugs.set(meta.slug, relFolder);
      projectSlugs.add(meta.slug);
    }
  }

  // Submissions are metadata-only: one project.yaml per folder.
  for (const file of walkFiles(folder)) {
    if (path.relative(folder, file) !== "project.yaml") {
      err(`${path.relative(ROOT, file)}: unexpected file — a submission folder contains only project.yaml; screenshots, docs and code live in your own repo`);
      continue;
    }
    if (fs.statSync(file).size > MAX_FILE_BYTES) {
      err(`${path.relative(ROOT, file)}: file exceeds 1 MB`);
      continue;
    }
    const content = fs.readFileSync(file, "utf8");
    for (const [re, label] of SECRET_PATTERNS) {
      if (re.test(content)) err(`${path.relative(ROOT, file)}: possible committed secret (${label})`);
    }
  }
}

for (const dir of listDirs(path.join(ROOT, "projects"))) checkSubmission(dir);

// ---------------------------------------------------------------- competitions
for (const cycle of listDirs(path.join(ROOT, "competitions"))) {
  const cycleDir = path.join(ROOT, "competitions", cycle);
  if (!/^\d{4}-\d{2}$/.test(cycle)) {
    warn(`competitions/${cycle}: folder name is not a YYYY-MM cycle — ignored by tooling`);
    continue;
  }
  if (!fs.existsSync(path.join(cycleDir, "README.md"))) {
    err(`competitions/${cycle}: missing README.md (theme, rules, deadline)`);
  }
  const winnersPath = path.join(cycleDir, "winners.yaml");
  if (fs.existsSync(winnersPath)) {
    const winners = readYaml(winnersPath);
    if (winners) {
      schemaErrors(validateWinners, winners, `competitions/${cycle}/winners.yaml`);
      if (winners.cycle && winners.cycle !== cycle) {
        err(`competitions/${cycle}/winners.yaml: cycle "${winners.cycle}" does not match folder name`);
      }
      const places = (winners.winners ?? []).map((w) => w.place).filter(Boolean);
      if (new Set(places).size !== places.length) {
        err(`competitions/${cycle}/winners.yaml: duplicate place — each of 1st/2nd/3rd may be awarded once`);
      }
      for (const w of winners.winners ?? []) {
        if (w.slug && !projectSlugs.has(w.slug)) {
          err(`competitions/${cycle}/winners.yaml: winner "${w.slug}" not found in projects/`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- report
console.log(`Checked ${listDirs(path.join(ROOT, "projects")).length} project(s).`);

for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} validation error(s). See CONTRIBUTING.md for the submission format.`);
  process.exit(1);
}
console.log("All submissions valid ✔");
