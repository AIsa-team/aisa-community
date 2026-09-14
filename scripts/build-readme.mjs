#!/usr/bin/env node
/**
 * Regenerates the auto-generated sections of README.md from submission metadata.
 *
 * Sections are delimited by HTML comment markers and fully overwritten:
 *   <!-- PROJECTS:START --> ... <!-- PROJECTS:END -->
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

function loadProjects() {
  const base = path.join(ROOT, "projects");
  const out = [];
  for (const dir of listDirs(base)) {
    const metaPath = path.join(base, dir, "project.yaml");
    if (!fs.existsSync(metaPath)) continue;
    try {
      out.push({ dir, ...readYaml(metaPath) });
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
    const endpoints = (p.aisa_endpoints_used ?? []).map((e) => `\`${esc(e)}\``).join(" ");
    return `| [**${esc(p.name)}**](projects/${p.dir}/) | ${esc(p.description)} | ${endpoints} | [@${esc(p.author?.github)}](https://github.com/${esc(p.author?.github)}) | ${links.join(" · ")} |`;
  });
  return ["| Project | What it does | AIsa endpoints used | Author | Links |", "|---|---|---|---|---|", ...rows].join("\n");
}

// If the newest cycle has no winners.yaml yet, it is the currently running
// (or upcoming) competition — promote it instead of showing an empty shelf.
// Theme and window are parsed from the cycle's own README, so cycle briefs
// stay the single source of truth.
function currentCycleBanner() {
  const cycles = listDirs(path.join(ROOT, "competitions")).filter((c) => /^\d{4}-\d{2}$/.test(c));
  const latest = cycles[cycles.length - 1];
  if (!latest) return null;
  const dir = path.join(ROOT, "competitions", latest);
  if (fs.existsSync(path.join(dir, "winners.yaml"))) return null; // decided — winners speak for themselves
  const briefPath = path.join(dir, "README.md");
  if (!fs.existsSync(briefPath)) return null;
  const brief = fs.readFileSync(briefPath, "utf8");
  const title = brief.match(/^# AIsa Competition — \d{4}-\d{2}:\s*(.+)$/m);
  const theme = title ? title[1].trim() : latest;
  const window = brief.match(/^\*\*Window:\*\*\s*([^·\n]+)/m);
  const windowText = window ? ` · ${window[1].trim()}` : "";
  return `🏁 **Now running: [${latest} — ${esc(theme)}](competitions/${latest}/)**${windowText} — see the brief for prizes and how to enter. Winners land here after judging.`;
}

function hallOfFame() {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const bySlug = new Map(loadProjects().map((p) => [p.slug, p]));
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
      .sort((a, b) => a.place - b.place)
      .map((w) => {
        const item = bySlug.get(w.slug);
        const label = item
          ? `[**${esc(item.name)}**](projects/${item.dir}/) by [@${esc(item.author?.github)}](https://github.com/${esc(item.author?.github)})`
          : `\`${esc(w.slug)}\``;
        const note = w.note ? ` — _${esc(w.note)}_` : "";
        return `- ${medals[w.place] ?? `#${w.place}`} ${label}${note}`;
      });
    const link = data.announcement_url ? ` · [announcement](${data.announcement_url})` : "";
    blocks.push(`### ${cycle} — ${esc(data.theme)}${link}\n\n${lines.join("\n")}`);
  }
  const banner = currentCycleBanner();
  if (banner) blocks.unshift(banner);
  return blocks.length
    ? blocks.join("\n\n")
    : "_No competitions yet — see [competitions/](competitions/)._";
}

function replaceSection(content, marker, body) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(content)) throw new Error(`README.md is missing markers ${start} / ${end}`);
  return content.replace(re, `${start}\n${body}\n${end}`);
}

const projects = loadProjects();
const contributors = new Set(projects.map((x) => x.author?.github?.toLowerCase()).filter(Boolean));
const stats = `**${projects.length}** projects · **${contributors.size}** contributors`;

let readme = fs.readFileSync(README, "utf8");
readme = replaceSection(readme, "STATS", stats);
readme = replaceSection(readme, "PROJECTS", projectsTable(projects));
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
