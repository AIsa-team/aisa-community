# Contributing to AIsa Community

One track: **a working product you built with AIsa**. Your product lives entirely in your own repo (code, screenshots, demo); you submit only metadata linking to it. Target time: **under 10 minutes**.

Not comfortable with git? Open a [submission issue](https://github.com/AIsa-team/aisa-community/issues/new/choose) instead and a maintainer will convert it into a PR crediting you.

**Using an AI agent?** Hand it [AGENTS.md](AGENTS.md) — a self-contained brief with the exact format, constraints and workflow, so your agent can prepare the submission without reading the rest of these docs.

## Eligibility — the endpoint rule

Your product must use **at least one AIsa endpoint that is not a plain model call** (e.g. `stock/prices`, `stock/news`, `search/web`, `search/scholar`, prediction-market or social-data endpoints). Thin wrappers around a chat/LLM completion don't qualify. This registry exists to grow what people can *build* with AIsa's data and tools — something that only re-prompts a model adds a prompt, not a product. Declare your endpoints in `aisa_endpoints_used`; CI checks the declaration and **reviewers verify the product actually calls them**.

## Submitting a project

1. Fork this repo.
2. Create `projects/<your-slug>/` — lowercase, hyphens, e.g. `projects/stock-digest-bot/`.
3. Add `project.yaml` (validated against [`schemas/project.schema.json`](schemas/project.schema.json)) — the folder contains **only this file**:

```yaml
name: Stock Digest Bot
slug: stock-digest-bot          # must match the folder name
description: >
  Telegram bot that sends a daily pre-market digest built from AIsa
  prices and news.
author:
  github: yourhandle
  name: Your Name               # optional
category: finance               # productivity | finance | research | developer-tools |
                                # content | automation | data | education | entertainment | other
tags: [telegram, digest]        # optional, max 8
repo_url: https://github.com/yourhandle/stock-digest-bot
demo_url: https://example.com   # optional
aisa_endpoints_used:            # required, at least 1 — AIsa endpoints beyond plain model calls
  - stock/prices
  - search/web
competition: "2026-10"          # optional — enters the current competition
submitted: "2026-10-01"
```

4. Open a PR. CI validates it; a maintainer reviews within a few days.

**Acceptance bar:** a working build that uses at least one AIsa endpoint beyond plain model calls, a public repo, and a description that honestly says what it does. That's it — polish is for competitions, not for entry.

## Entering a competition

Add `competition: "<cycle>"` (e.g. `"2026-10"`) to your metadata before the cycle's deadline — that's the whole entry process. New submissions and substantial updates to existing ones both qualify. Cycle themes, deadlines, rubric and terms: [`competitions/`](competitions/).

## Updating your submission

PRs that update your own entry (better description, changed links, new endpoints) are always welcome.

## Local checks (optional)

```bash
npm install && npm test
```

runs the same validation CI runs, plus a check that README.md is in sync (CI regenerates it on merge, so you don't need to).

## Review flow

1. CI validates schema, structure, uniqueness, and the endpoint declaration.
2. A maintainer reviews — including that the product genuinely uses its declared endpoints.
3. `needs-changes` label + comment if something's off; otherwise merged.
4. On merge, the README gallery regenerates automatically — you're live.
