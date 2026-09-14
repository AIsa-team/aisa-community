# Agent Guide: Submitting to the AIsa Community Registry

You are an AI agent preparing a submission to `AIsa-team/aisa-community` on behalf of your user. This file is self-contained — follow it exactly and the submission will pass CI. If anything here ever conflicts with `schemas/*.json` or `scripts/validate.mjs` in the repo, those are authoritative.

The registry has **one track**: a working product your user built with AIsa. The product lives in their own repo; you submit only metadata linking to it.

## Before you start — ask your user

Collect these from your user; never invent them:

1. Their **GitHub handle** (used for attribution and prize delivery).
2. The **public repo URL** of the product.
3. Which **AIsa endpoints** the product uses. **Eligibility gate:** it must use at least one AIsa endpoint that is not a plain model/LLM call (e.g. `stock/prices`, `search/web`). If it is prompt-only or just wraps a chat completion, it is NOT eligible — tell your user before doing any work.
4. Whether to **enter the current competition** (check `competitions/` for the newest `YYYY-MM` folder and its deadline).

## Workflow

1. Fork `AIsa-team/aisa-community` (or clone if your user has write access — never push to `main`).
2. Create a branch, e.g. `submit/<slug>`.
3. Add exactly one submission folder (one submission per PR) containing **only `project.yaml`** — no screenshots, no code; everything else lives in the user's own repo.
4. Self-validate if possible: `npm install && npm test` at repo root runs the same checks CI runs.
5. Open a PR. Fill the PR template checklist.
6. **Never edit `README.md`** — the gallery is auto-generated on merge. Never touch other people's submission folders.

## The metadata file — exact spec

Path: `projects/<slug>/project.yaml`. Unknown fields are rejected.

**Slug rules:** lowercase letters, digits, hyphens; 3–50 chars; starts/ends alphanumeric (`^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`). Must be unique across `projects/` — check existing folders first. The folder name must equal the slug.

```yaml
# projects/<slug>/project.yaml
name: My Product Name            # required, 2–60 chars, display name
slug: my-product-name            # required, must match folder name
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
aisa_endpoints_used:             # required, min 1 — AIsa endpoints the product ACTUALLY calls.
  - stock/prices                 #   Plain model/LLM calls (e.g. "llm", "chat/completions")
  - search/web                   #   are rejected by CI and do not qualify.
license: MIT                     # optional, SPDX id of the product's own license
competition: "2026-10"           # optional — quote it; enters that competition cycle
submitted: "2026-10-01"          # required, YYYY-MM-DD, today's date, quoted
```

## Competition entry

To enter, set `competition: "YYYY-MM"` (quoted) using the newest cycle folder under `competitions/` — confirm the deadline in that cycle's `README.md`. Max 2 entries per person per cycle. Never put the user's email or contact details anywhere in the repo — winners are contacted through GitHub.

## Common CI failures to avoid

| Mistake | Fix |
|---|---|
| Slug ≠ folder name | Make them identical |
| Unquoted `competition` or `submitted` | Quote them — YAML mangles them otherwise |
| Unknown fields in project.yaml (e.g. `screenshot`) | Remove — schema rejects unknown fields |
| Extra files in the submission folder | Only `project.yaml` — everything else lives in the user's repo |
| `aisa_endpoints_used` missing, or lists a plain model call (`llm`, `chat`, ...) | Declare ≥1 real AIsa endpoint the product calls; prompt-only products are not eligible |
| `http://` URLs | Use `https://` |
| Editing README.md | Don't — it's regenerated on merge |

## Final checklist before opening the PR

- [ ] Exactly one new folder under `projects/`, containing only `project.yaml`
- [ ] `npm test` passes locally (if you can run it)
- [ ] All facts (URLs, handle, endpoints) confirmed with the user, not guessed
- [ ] ≥1 declared AIsa endpoint beyond plain model calls, genuinely used by the product
- [ ] PR body uses the template's checklist
