# Agent Guide: Submitting to the AIsa Community Registry

You are an AI agent preparing a submission to `AIsa-team/aisa-community` on behalf of your user. This file is self-contained — follow it exactly and the submission will pass CI. If anything here ever conflicts with `schemas/*.json` or `scripts/validate.mjs` in the repo, those are authoritative.

## Before you start — ask your user

Collect these from your user; never invent them:

1. **Track**: is this a *project* (built **with** AIsa, lives in their own repo) or a *skill* (built **for** AIsa, code vendored into this repo)?
2. Their **GitHub handle** (used for attribution and prize delivery).
3. The **public repo URL** of the work (projects: required; skills: optional upstream).
4. For skills: which **OSI license** to publish under (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `MPL-2.0`, or `Unlicense`).
5. For skills: which **AIsa endpoints** the skill uses. **Eligibility gate:** a skill must use at least one AIsa endpoint that is not a plain model/LLM call (e.g. `stock/prices`, `search/web`). If the skill is prompt-only or just wraps a chat completion, it is NOT eligible — tell your user before doing any work.
6. Whether to **enter the current competition** (check `competitions/` for the newest `YYYY-MM` folder and its deadline).

## Workflow

1. Fork `AIsa-team/aisa-community` (or clone if your user has write access — never push to `main`).
2. Create a branch, e.g. `submit/<slug>`.
3. Add exactly one submission folder (one submission per PR).
4. Self-validate if possible: `npm install && npm test` at repo root runs the same checks CI runs.
5. Open a PR. Fill the PR template checklist for your track only; delete the other section.
6. **Never edit `README.md`** — the gallery is auto-generated on merge. Never touch other people's submission folders.

## Slug rules (both tracks)

- Lowercase letters, digits, hyphens; 3–50 chars; starts/ends alphanumeric. Pattern: `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`
- Must be unique across BOTH `projects/` and `skills/` — check existing folders first.
- The folder name must equal the slug.

## Track 1: Project submission

Create **one file**: `projects/<slug>/project.yaml`. No other files — no screenshots, no code; everything else lives in the user's own repo. Unknown fields are rejected.

```yaml
# projects/<slug>/project.yaml
name: My Project Name            # required, 2–60 chars, display name
slug: my-project-name            # required, must match folder name
description: >                   # required, 10–300 chars — what it does, why interesting
  One or two honest sentences.
author:
  github: their-github-handle    # required
  name: Their Name               # optional, max 80 chars
category: finance                # required — one of: productivity | finance | research |
                                 #   developer-tools | content | automation | data |
                                 #   education | entertainment | other
tags: [bot, telegram]            # optional, max 8, each: lowercase/digits/hyphens
repo_url: https://github.com/... # required, must be https and public
demo_url: https://...            # optional, https
video_url: https://...           # optional, https
aisa_endpoints_used:             # optional, but if present min 1 item
  - stock/prices                 # which AIsa endpoints the project calls
  - search/web
license: MIT                     # optional, SPDX id of the project's own license
competition: "2026-09"           # optional — quote it; enters that competition cycle
submitted: "2026-08-27"          # required, YYYY-MM-DD, today's date, quoted
```

## Track 2: Skill submission

**Eligibility first:** the skill must use ≥1 AIsa endpoint beyond plain model calls (declared in `aisa_endpoints_used`, verified by reviewers against the code). Prompt-only skills are rejected.

Skills follow the Skills Directory format (frontmatter: skillsdirectory.com/docs/skill-md-format; structure: skillsdirectory.com/docs/skill-file-structure). Folder layout — CI rejects anything outside this:

```
skills/<slug>/
├── skill.yaml        # REQUIRED — registry metadata (spec below)
├── SKILL.md          # REQUIRED — frontmatter + agent instructions, max 500 lines
├── LICENSE           # optional (only allowed loose top-level file besides the two above)
├── references/       # optional — on-demand docs, max 200 lines PER FILE
├── scripts/          # optional — executable code, max 300 lines PER FILE
├── templates/        # optional — file templates (e.g. component.tsx.template), max 100 lines PER FILE
└── assets/           # optional — static files (config, images, data)
```

Every file must be under 1 MB. No other top-level files or directories — code goes in `scripts/`, docs in `references/`.

### skill.yaml (registry metadata — exact spec, unknown fields rejected)

```yaml
# skills/<slug>/skill.yaml
slug: my-skill                   # required, must match folder name AND frontmatter name
author:
  github: their-github-handle    # required
  name: Their Name               # optional
category: utilities              # required — one of: data | finance | search | social |
                                 #   productivity | developer-tools | media | utilities | other
version: "1.0.0"                 # required, semver, quoted — bump on code changes
license: MIT                     # required — exactly one of: MIT | Apache-2.0 | BSD-2-Clause |
                                 #   BSD-3-Clause | ISC | MPL-2.0 | Unlicense
aisa_endpoints_used:             # required, min 1 — AIsa endpoints the code ACTUALLY calls.
  - stock/prices                 #   Plain model/LLM calls (e.g. "llm", "chat/completions") are
  - search/web                   #   rejected by CI and do not qualify.
repo_url: https://github.com/... # optional — upstream repo if maintained elsewhere
requirements: []                 # required to think about: API keys / accounts / system deps.
                                 #   [] if none. LIST EVERY EXTERNAL DEPENDENCY.
competition: "2026-09"           # optional — quote it
submitted: "2026-08-27"          # required, YYYY-MM-DD, quoted
```

### SKILL.md

Must open with YAML frontmatter. The registry reads only `name` and `description` from it:

```markdown
---
name: my-skill
description: What it does and when to use it. Under 200 chars. This is what
  agents match on — include trigger situations.
---

# My Skill

## What it does
...

## When an agent should use it
Concrete trigger phrases/situations.

## Usage
Exact commands, e.g. `bash scripts/run.sh <arg>`.

## External endpoints & requirements
- Network endpoints called: <every one, or "none">
- Credentials/API keys required: <every one, or "none">
- System dependencies: <e.g. bash, python3>
```

Frontmatter rules:
- `name`: required, lowercase/digits/hyphens, **must equal the slug**.
- `description`: required, ≥10 chars; keep under 200 (longer = CI warning).
- `version`, `author`, `tags`, `requires`: optional per spec — do NOT add them unless the user's upstream SKILL.md already has them. If `version` is present it **must match** `skill.yaml`'s version. Unknown fields trigger warnings.
- If the user has an existing SKILL.md, vendor it **byte-identical** — do not reformat it.
- The "External endpoints & requirements" section in the body is mandatory registry policy.

### Skill security policy (CI scans + human review will enforce)

Automatic rejection: runtime download-and-execute (`curl | sh` etc.), reading credential stores (`~/.ssh`, `~/.aws`, ...) beyond declared requirements, undocumented network endpoints, obfuscated/encoded logic, committed secrets, destructive operations outside the working directory without a confirmation step, cryptominers, bulk messaging.

If the skill can execute **financial transactions** (trading, transfers, payments, crypto): it is allowed only if SKILL.md opens with a prominent ⚠️ warning stating real money/assets can move and the worst-case outcome; every transaction path requires explicit user confirmation by default (unattended mode only as documented, off-by-default opt-in); and every venue/chain plus credential is declared. Hiding transaction capability is treated as malicious.

## Competition entry

To enter, set `competition: "YYYY-MM"` (quoted) in `project.yaml`/`skill.yaml`, using the newest cycle folder under `competitions/` — confirm the deadline in that cycle's `README.md`. Max 2 entries per person per cycle; prizes are AIsa credits + official-channel features. Never put the user's email or contact details anywhere in the repo — winners are contacted through GitHub.

## Common CI failures to avoid

| Mistake | Fix |
|---|---|
| Slug ≠ folder name (or ≠ frontmatter name) | Make all identical |
| Unquoted `version`, `competition`, or `submitted` | Quote them — YAML mangles them otherwise |
| `screenshot:` or other unknown fields in project.yaml | Remove — schema rejects unknown fields |
| `name`/`description`/`version`/`tags` in skill.yaml | Remove — those live in SKILL.md frontmatter / registry uses skill.yaml `version` only |
| `aisa_endpoints_used` missing, or lists a plain model call (`llm`, `chat`, ...) | Declare ≥1 real AIsa endpoint the code calls; prompt-only skills are not eligible |
| Loose script or doc at skill top level | Move into `scripts/` / `references/` |
| `http://` URLs | Use `https://` |
| Frontmatter missing or not first thing in SKILL.md | `---` block must start at line 1 |
| Editing README.md | Don't — it's regenerated on merge |

## Final checklist before opening the PR

- [ ] Exactly one new folder, under the correct track directory
- [ ] `npm test` passes locally (if you can run it)
- [ ] All facts (URLs, handle, license) confirmed with the user, not guessed
- [ ] For skills: every endpoint and credential declared; security policy satisfied
- [ ] For skills: ≥1 declared AIsa endpoint beyond plain model calls, and the code genuinely calls it
- [ ] PR body uses the template's checklist for the relevant track only
