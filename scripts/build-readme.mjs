#!/usr/bin/env node
/**
 * Regenerates the auto-generated sections of README.md from submission metadata.
 *
 * Sections are delimited by HTML comment markers and fully overwritten:
 *   <!-- PROJECTS:START --> ... <!-- PROJECTS:END -->
 *   <!-- SKILLS:START --> ... <!-- SKILLS:END -->
 *   <!-- HALL_OF_FAME:START --> ... <!-- HALL_OF_FAME:END -->
 *   <!-- STATS:START --> ... <!-- STATS:END -->
 *
 * Everything outside the markers is hand-maintained and left untouched.
 * Run: node scripts/build-readme.mjs        (rewrites README.md if changed)
 *      node scripts/build-readme.mjs --check  (exit 1 if README.md is stale)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const README = path.join(ROOT, "README.md");
const CHECK = process.argv.includes("--check");

const listDirs = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
        .map((d) => d.name)
        .sort()
    : [];

const readYaml = (f) => yaml.load(fs.readFileSync(f, "utf8"));
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();

// Skills are hybrid-sourced: name/description come from the SKILL.md frontmatter
// (the only fields the spec guarantees — https://www.skillsdirectory.com/docs/skill-md-format);
// everything else the registry needs (version, author, category, ...) comes from skill.yaml.
function readFrontmatter(file) {
  if (!fs.existsSync(file)) return {};
  const m = fs.readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return {};
  try {
    const fm = yaml.load(m[1]);
    return fm && typeof fm === "object" && !Array.isArray(fm) ? fm : {};
  } catch {
    return {};
  }
}

function loadTrack(track) {
  const base = path.join(ROOT, track === "project" ? "projects" : "skills");
  const metaName = track === "project" ? "project.yaml" : "skill.yaml";
  const out = [];
  for (const dir of listDirs(base)) {
    const metaPath = path.join(base, dir, metaName);
    if (!fs.existsSync(metaPath)) continue;
    try {
      const meta = readYaml(metaPath);
      if (track === "skill") {
        const fm = readFrontmatter(path.join(base, dir, "SKILL.md"));
        out.push({
          dir,
          ...meta,
          name: fm.name ?? meta.slug ?? dir,
          description: fm.description ?? "",
        });
      } else {
        out.push({ dir, ...meta });
      }
    } catch {
      /* validate.mjs reports parse errors; skip here */
    }
  }
  // Newest first, then alphabetical.
  return out.sort(
    (a, b) => (b.submitted ?? "").localeCompare(a.submitted ?? "") || (a.name ?? "").localeCompare(b.name ?? ""),
  );
}

function projectsTable(items) {
  if (!items.length) return "_No projects yet — [be the first](CONTRIBUTING.md)!_";
  const rows = items.map((p) => {
    const links = [`[repo](${p.repo_url})`];
    if (p.demo_url) links.push(`[demo](${p.demo_url})`);
    if (p.video_url) links.push(`[video](${p.video_url})`);
    const endpoints = (p.aisa_endpoints_used ?? []).map((s) => `\`${esc(s)}\``).join(" ");
    return `| [**${esc(p.name)}**](projects/${p.dir}/) | ${esc(p.description)} | ${endpoints} | [@${esc(p.author?.github)}](https://github.com/${esc(p.author?.github)}) | ${links.join(" · ")} |`;
  });
  return ["| Project | What it does | AIsa endpoints used | Author | Links |", "|---|---|---|---|---|", ...rows].join("\n");
}

function skillsTable(items) {
  if (!items.length) return "_No community skills yet — [be the first](CONTRIBUTING.md)!_";
  const rows = items.map((s) => {
    const reqs = s.requirements?.length ? esc(s.requirements.join(", ")) : "none";
    const endpoints = (s.aisa_endpoints_used ?? []).map((e) => `\`${esc(e)}\``).join(" ");
    return `| [**${esc(s.name)}**](skills/${s.dir}/) | ${esc(s.description)} | ${endpoints} | ${esc(s.category)} | ${esc(s.version)} | ${reqs} | [@${esc(s.author?.github)}](https://github.com/${esc(s.author?.github)}) |`;
  });
  return ["| Skill | What it does | AIsa endpoints | Category | Version | Requires | Author |", "|---|---|---|---|---|---|---|", ...rows].join("\n");
}

function hallOfFame() {
  const bySlug = new Map();
  for (const track of ["project", "skill"]) {
    for (const item of loadTrack(track)) bySlug.set(`${track}:${item.slug}`, item);
  }
  const blocks = [];
  for (const cycle of listDirs(path.join(ROOT, "competitions")).reverse()) {
    const winnersPath = path.join(ROOT, "competitions", cycle, "winners.yaml");
    if (!/^\d{4}-\d{2}$/.test(cycle) || !fs.existsSync(winnersPath)) continue;
    let data;
    try {
      data = readYaml(winnersPath);
    } catch {
      continue;
    }
    const lines = (data.winners ?? [])
      .sort((a, b) => (a.track === b.track ? 0 : a.track === "project" ? -1 : 1))
      .map((w) => {
        const item = bySlug.get(`${w.track}:${w.slug}`);
        const label = item
          ? `[**${esc(item.name)}**](${w.track === "project" ? "projects" : "skills"}/${item.dir}/) by [@${esc(item.author?.github)}](https://github.com/${esc(item.author?.github)})`
          : `\`${esc(w.slug)}\``;
        const note = w.note ? ` — _${esc(w.note)}_` : "";
        const trackLabel = w.track === "project" ? "Best Project" : "Best Skill";
        return `- 🏆 **${trackLabel}:** ${label}${note}`;
      });
    const link = data.announcement_url ? ` · [announcement](${data.announcement_url})` : "";
    blocks.push(`### ${cycle} — ${esc(data.theme)}${link}\n\n${lines.join("\n")}`);
  }
  return blocks.length
    ? blocks.join("\n\n")
    : "_No competitions decided yet. The first cycle is underway — see [competitions/](competitions/)._";
}

function replaceSection(content, marker, body) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(content)) throw new Error(`README.md is missing markers ${start} / ${end}`);
  return content.replace(re, `${start}\n${body}\n${end}`);
}

const projects = loadTrack("project");
const skills = loadTrack("skill");
const contributors = new Set(
  [...projects, ...skills].map((x) => x.author?.github?.toLowerCase()).filter(Boolean),
);
const stats = `**${projects.length}** projects · **${skills.length}** skills · **${contributors.size}** contributors`;

let readme = fs.readFileSync(README, "utf8");
readme = replaceSection(readme, "STATS", stats);
readme = replaceSection(readme, "PROJECTS", projectsTable(projects));
readme = replaceSection(readme, "SKILLS", skillsTable(skills));
readme = replaceSection(readme, "HALL_OF_FAME", hallOfFame());

const current = fs.readFileSync(README, "utf8");
if (readme !== current) {
  if (CHECK) {
    console.error("README.md is stale — run `node scripts/build-readme.mjs` and commit the result.");
    process.exit(1);
  }
  fs.writeFileSync(README, readme);
  console.log("README.md regenerated.");
} else {
  console.log("README.md already up to date.");
}
