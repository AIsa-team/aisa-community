#!/usr/bin/env node
/**
 * Validates every submission in projects/ and skills/, plus competition winners files.
 *
 * Checks:
 *  - metadata parses as YAML and matches its JSON Schema
 *  - slug matches the folder name; slugs are unique across the whole registry
 *  - skills follow the Skills Directory format:
 *      frontmatter spec:  https://www.skillsdirectory.com/docs/skill-md-format
 *      file structure:    https://www.skillsdirectory.com/docs/skill-file-structure
 *  - no obvious secrets committed (API keys, private keys, tokens)
 *  - skills contain no obviously dangerous shell patterns (best-effort — human
 *    review per SECURITY.md is still mandatory)
 *  - winners.yaml files reference submissions that actually exist
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
const MAX_SKILL_FILE_BYTES = 1 * 1024 * 1024;

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
const validateSkill = loadSchema("skill.schema.json");
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

const TEXT_EXTENSIONS = new Set([
  ".md", ".txt", ".yaml", ".yml", ".json", ".toml", ".ini", ".cfg",
  ".py", ".js", ".mjs", ".cjs", ".ts", ".sh", ".bash", ".zsh", ".rb", ".go", ".rs",
]);

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

// Best-effort dangerous-pattern scan for vendored skill code.
const DANGER_PATTERNS = [
  [/\brm\s+-[a-zA-Z]*rf?\s+[~/]/, "recursive delete of home or root path"],
  [/(?:curl|wget)[^\n|;&]*\|\s*(?:ba|z|da)?sh\b/, "pipe remote download into a shell"],
  [/base64\s+(?:-d|--decode)[^\n]*\|\s*(?:ba|z|da)?sh\b/, "decode-and-execute payload"],
  [/\bchmod\s+[0-7]*777\b/, "world-writable chmod"],
  [/(?:~|\$HOME|\$\{HOME\})\/\.(?:ssh|aws|gnupg|config\/gh)\b/, "reads credential/key directories"],
  [/\bhistory\s+-c\b/, "shell history wipe"],
  [/\bnc\s+(?:-[a-zA-Z]+\s+)*\d{1,3}(?:\.\d{1,3}){3}\b/, "raw netcat to an IP"],
];

function scanFileContent(file, { danger }) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (!TEXT_EXTENSIONS.has(ext) && !base.startsWith("SKILL")) return;
  const stat = fs.statSync(file);
  if (stat.size > MAX_SKILL_FILE_BYTES) {
    err(`${path.relative(ROOT, file)}: file exceeds 1 MB — keep vendored skills small, host assets upstream`);
    return;
  }
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(content)) err(`${rel}: possible committed secret (${label})`);
  }
  if (danger) {
    for (const [re, label] of DANGER_PATTERNS) {
      if (re.test(content)) err(`${rel}: dangerous pattern (${label}) — see SECURITY.md`);
    }
  }
}

// ------------------------------------------------- skill format (Skills Directory)
// Frontmatter spec: https://www.skillsdirectory.com/docs/skill-md-format
// File structure:   https://www.skillsdirectory.com/docs/skill-file-structure
const SKILL_DIRS = new Set(["references", "scripts", "templates", "assets"]);
const SKILL_TOP_FILES = new Set(["SKILL.md", "skill.yaml", "LICENSE"]);
const FRONTMATTER_KNOWN = new Set(["name", "description", "version", "author", "tags", "requires"]);
const countLines = (file) => fs.readFileSync(file, "utf8").split("\n").length;

// Values that are obviously NOT a qualifying AIsa endpoint — every submission
// (project or skill) must use at least one AIsa endpoint beyond plain model/LLM
// calls (see CONTRIBUTING.md). This is a floor; reviewers verify the code
// actually calls what is declared.
const NON_QUALIFYING_ENDPOINT = /^(none|n\/?a|-|llm|model|models?\/.*|chat|completions?|chat\/completions?|plain model call|prompt|gpt|claude)$/i;

function checkSkillFormat(folder, relFolder, meta) {
  // --- file structure ---
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (!SKILL_DIRS.has(entry.name)) {
        err(`${relFolder}/${entry.name}/: unknown directory — allowed: references/, scripts/, templates/, assets/ (see https://www.skillsdirectory.com/docs/skill-file-structure)`);
      }
    } else if (!SKILL_TOP_FILES.has(entry.name)) {
      err(`${relFolder}/${entry.name}: loose top-level file — put code in scripts/, docs in references/, file templates in templates/, static files in assets/`);
    }
  }
  for (const [dir, limit] of [["references", 200], ["scripts", 300], ["templates", 100]]) {
    const d = path.join(folder, dir);
    if (!fs.existsSync(d)) continue;
    for (const file of walkFiles(d)) {
      if (countLines(file) > limit) {
        err(`${path.relative(ROOT, file)}: exceeds ${limit} lines (limit for ${dir}/)`);
      }
    }
  }

  // --- SKILL.md frontmatter ---
  const skillMd = path.join(folder, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    err(`${relFolder}: missing SKILL.md (required for skills — see CONTRIBUTING.md)`);
    return;
  }
  if (countLines(skillMd) > 500) {
    err(`${relFolder}/SKILL.md: exceeds 500 lines — move detail into references/`);
  }
  const text = fs.readFileSync(skillMd, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) {
    err(`${relFolder}/SKILL.md: must start with YAML frontmatter (--- blocks) — see https://www.skillsdirectory.com/docs/skill-md-format`);
    return;
  }
  let fm;
  try {
    fm = yaml.load(m[1]);
  } catch (e) {
    err(`${relFolder}/SKILL.md: frontmatter YAML parse error — ${e.message.split("\n")[0]}`);
    return;
  }
  if (!fm || typeof fm !== "object" || Array.isArray(fm)) {
    err(`${relFolder}/SKILL.md: frontmatter must be a YAML mapping with at least name and description`);
    return;
  }
  if (typeof fm.name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name)) {
    err(`${relFolder}/SKILL.md: frontmatter "name" is required — lowercase letters, numbers and hyphens only`);
  } else if (meta?.slug && fm.name !== meta.slug) {
    err(`${relFolder}/SKILL.md: frontmatter name "${fm.name}" must match the skill slug "${meta.slug}"`);
  }
  if (typeof fm.description !== "string" || fm.description.trim().length < 10) {
    err(`${relFolder}/SKILL.md: frontmatter "description" is required — what the skill does and when to use it`);
  } else if (fm.description.length > 200) {
    warn(`${relFolder}/SKILL.md: description is ${fm.description.length} chars — under 200 recommended`);
  }
  // Optional spec fields are the author's own — never required by the registry,
  // only type-checked (and version consistency-checked) when present.
  if (fm.version !== undefined) {
    if (typeof fm.version !== "string" || !/^\d+\.\d+\.\d+$/.test(fm.version)) {
      err(`${relFolder}/SKILL.md: frontmatter "version" must be a semver string (quote it: "1.0.0")`);
    } else if (meta?.version && fm.version !== meta.version) {
      err(`${relFolder}/SKILL.md: frontmatter version "${fm.version}" does not match skill.yaml version "${meta.version}"`);
    }
  }
  if (fm.author !== undefined && typeof fm.author !== "string") {
    err(`${relFolder}/SKILL.md: frontmatter "author" must be a string`);
  }
  for (const key of ["tags", "requires"]) {
    if (fm[key] !== undefined && (!Array.isArray(fm[key]) || fm[key].some((t) => typeof t !== "string"))) {
      err(`${relFolder}/SKILL.md: frontmatter "${key}" must be an array of strings`);
    }
  }
  for (const key of Object.keys(fm)) {
    if (!FRONTMATTER_KNOWN.has(key)) {
      warn(`${relFolder}/SKILL.md: unknown frontmatter field "${key}" (spec fields: name, description, version, author, tags, requires)`);
    }
  }
}

// ---------------------------------------------------------------- submissions
const seenSlugs = new Map(); // slug -> where
const registry = { project: new Set(), skill: new Set() };

function checkSubmission(track, dir) {
  const folder = path.join(ROOT, track === "project" ? "projects" : "skills", dir);
  const metaName = track === "project" ? "project.yaml" : "skill.yaml";
  const metaPath = path.join(folder, metaName);
  const relFolder = path.relative(ROOT, folder);

  if (!fs.existsSync(metaPath)) {
    err(`${relFolder}: missing ${metaName}`);
    return;
  }
  const meta = readYaml(metaPath);
  if (!meta) return;

  const validate = track === "project" ? validateProject : validateSkill;
  schemaErrors(validate, meta, `${relFolder}/${metaName}`);

  // Endpoint eligibility (both tracks): declared endpoints must be real AIsa
  // endpoints, not plain model/LLM calls.
  for (const ep of meta.aisa_endpoints_used ?? []) {
    if (typeof ep === "string" && NON_QUALIFYING_ENDPOINT.test(ep.trim())) {
      err(`${relFolder}/${metaName}: aisa_endpoints_used entry "${ep}" is not a qualifying AIsa endpoint — submissions must use at least one endpoint beyond plain model calls (e.g. stock/prices, search/web); see CONTRIBUTING.md`);
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
      registry[track].add(meta.slug);
    }
  }

  if (track === "skill") checkSkillFormat(folder, relFolder, meta);

  // Content scan: secrets everywhere, dangerous patterns only for vendored skill code.
  for (const file of walkFiles(folder)) {
    scanFileContent(file, { danger: track === "skill" });
  }
}

for (const dir of listDirs(path.join(ROOT, "projects"))) checkSubmission("project", dir);
for (const dir of listDirs(path.join(ROOT, "skills"))) checkSubmission("skill", dir);

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
      const tracks = (winners.winners ?? []).map((w) => w.track).filter(Boolean);
      if (new Set(tracks).size !== tracks.length) {
        err(`competitions/${cycle}/winners.yaml: duplicate track — at most one project winner and one skill winner per cycle`);
      }
      for (const w of winners.winners ?? []) {
        if (w.slug && w.track && !registry[w.track]?.has(w.slug)) {
          err(`competitions/${cycle}/winners.yaml: winner "${w.slug}" not found in ${w.track === "project" ? "projects/" : "skills/"}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- report
const nProjects = listDirs(path.join(ROOT, "projects")).length;
const nSkills = listDirs(path.join(ROOT, "skills")).length;
console.log(`Checked ${nProjects} project(s), ${nSkills} skill(s).`);

for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} validation error(s). See CONTRIBUTING.md for the submission format.`);
  process.exit(1);
}
console.log("All submissions valid ✔");
