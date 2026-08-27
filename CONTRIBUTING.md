# Contributing to AIsa Community

Two tracks, both submitted via pull request. Target time: **under 10 minutes**.

- **Project** — something you *built with* AIsa. Lives entirely in your own repo (code, screenshots, demo); you submit only metadata linking to it.
- **Skill** — something you *built for* AIsa. The code is vendored here so others can review and install it.

Not comfortable with git? Open a [submission issue](https://github.com/AIsa-team/aisa-community/issues/new/choose) instead and a maintainer will convert it into a PR crediting you.

**Using an AI agent?** Hand it [AGENTS.md](AGENTS.md) — a self-contained brief with the exact formats, constraints and workflow, so your agent can prepare the submission without reading the rest of these docs.

---

## Submitting a project

1. Fork this repo.
2. Create `projects/<your-slug>/` — lowercase, hyphens, e.g. `projects/stock-digest-bot/`.
3. Add `project.yaml` (validated against [`schemas/project.schema.json`](schemas/project.schema.json)) — metadata only; screenshots, demos and everything else live in your own repo:

```yaml
name: Stock Digest Bot
slug: stock-digest-bot          # must match the folder name
description: >
  Telegram bot that sends a daily pre-market digest built from AIsa
  marketpulse prices and news.
author:
  github: yourhandle
  name: Your Name               # optional
category: finance               # productivity | finance | research | developer-tools |
                                # content | automation | data | education | entertainment | other
tags: [telegram, digest]        # optional, max 8
repo_url: https://github.com/yourhandle/stock-digest-bot
demo_url: https://example.com   # optional
aisa_endpoints_used: [stock/prices, search/web]
competition: "2026-09"          # optional — enters the current competition
submitted: "2026-09-05"
```

4. Open a PR. CI validates it; a maintainer reviews within a few days.

**Acceptance bar:** it must actually use AIsa, the repo must be public, and the description must honestly say what it does. That's it — polish is for competitions, not for entry.

## Submitting a skill

Skills must follow the Skills Directory format: the [SKILL.md frontmatter spec](https://www.skillsdirectory.com/docs/skill-md-format) and the [skill file structure](https://www.skillsdirectory.com/docs/skill-file-structure). CI enforces both.

1. Fork this repo.
2. Create `skills/<your-slug>/` with this structure (keep files under 1 MB; host big assets upstream):

```
skills/<your-slug>/
├── skill.yaml        # registry metadata — this repo's format, see below
├── SKILL.md          # the skill: YAML frontmatter + instructions (max 500 lines)
├── references/       # optional — on-demand docs, max 200 lines per file
├── scripts/          # optional — executable code, max 300 lines per file
├── templates/        # optional — file templates (component.tsx.template), max 100 lines
└── assets/           # optional — static files: config, images, data
```

No loose top-level files besides `skill.yaml`, `SKILL.md` and an optional `LICENSE` — code goes in `scripts/`, docs in `references/`.

3. `SKILL.md` opens with YAML frontmatter. The registry reads only the two fields the spec guarantees — `name` (must match your slug) and `description`:

```markdown
---
name: fx-rates-lookup
description: Looks up spot FX rates for major pairs. Use when the user asks
  for an exchange rate or currency conversion.
---

# FX Rates Lookup

...instructions for the agent: what it does, when to invoke it, exact usage...
```

The spec's optional fields (`version`, `author`, `tags`, `requires`) are welcome but **never required by the registry** — so an upstream SKILL.md drops in unchanged, with or without them. If you do set a frontmatter `version`, it must match the one in `skill.yaml`. Keep the description under 200 characters and include *when to use it* — that's what agents match on.

4. Add `skill.yaml` — **registry-only** metadata (validated against [`schemas/skill.schema.json`](schemas/skill.schema.json)). It deliberately does *not* repeat the frontmatter fields, so your SKILL.md stays byte-identical to any upstream copy and fully portable to other platforms:

```yaml
slug: fx-rates-lookup           # must match the folder name and the frontmatter name
author:
  github: yourhandle            # GitHub handle — attribution and prize delivery
category: finance               # data | finance | search | social | productivity |
                                # developer-tools | media | utilities | other
version: "1.0.0"                # bump on code changes
license: MIT                    # required — OSI license, code is vendored here
repo_url: https://github.com/yourhandle/fx-rates-lookup   # optional upstream
requirements: []                # API keys / accounts / system deps, [] if none
competition: "2026-09"          # optional
submitted: "2026-09-05"
```

5. Open a PR.

**Skill review is stricter** because it's executable code others will run:

- `SKILL.md` must document every external call the skill makes and every requirement (API keys, accounts).
- No obfuscated code, no download-and-execute, no reading credentials beyond declared requirements. Full policy: [SECURITY.md](SECURITY.md).
- CI runs an automated safety scan; a maintainer also reads the code.

Standout community skills can be **promoted into the official [AIsa-team/agent-skills](https://github.com/AIsa-team/agent-skills) catalog** — we'll open that conversation with you if your skill qualifies.

## Entering a competition

Add `competition: "<cycle>"` (e.g. `"2026-09"`) to your metadata before the cycle's deadline — that's the whole entry process. New submissions and substantial updates to existing ones both qualify. Cycle themes, deadlines, rubric and terms: [`competitions/`](competitions/).

## Updating your submission

PRs that update your own entry (new version, better description, changed links) are always welcome. Bump `version` in `skill.yaml` for skill code changes (and keep the optional frontmatter version in sync if your SKILL.md sets one).

## Local checks (optional)

```bash
npm install && npm test
```

runs the same validation CI runs, plus a check that README.md is in sync (CI regenerates it on merge, so you don't need to).

## Review flow

1. CI validates schema, structure, uniqueness, and safety patterns.
2. A maintainer reviews (projects: light check; skills: code review).
3. `needs-changes` label + comment if something's off; otherwise merged.
4. On merge, the README gallery regenerates automatically — you're live.
