---
name: hello-aisa-skill
description: Greets the user with a ticker's latest close fetched from the AIsa stock/prices endpoint. Seed example demonstrating the community skill format — copy its structure.
---

# Hello AIsa Skill

> This is the **seed example** for the community skill format. It follows the [SKILL.md frontmatter spec](https://www.skillsdirectory.com/docs/skill-md-format) and the [skill file structure](https://www.skillsdirectory.com/docs/skill-file-structure) — and it demonstrates the **endpoint rule**: every skill must genuinely use at least one AIsa endpoint beyond plain model calls. Here, that endpoint is `stock/prices`.

## What it does

Greets the user with the latest closing price of a ticker. The price comes from the AIsa `stock/prices` endpoint — the skill's reason to exist — and a small script formats the greeting line.

## When an agent should use it

Never, in practice — it's a format demo. A real SKILL.md should describe concrete trigger phrases or situations, e.g. *"invoke when the user asks for spot FX rates."*

## Usage

1. Call the AIsa `stock/prices` endpoint for the ticker (daily bars; the latest close is the last bar):

   ```
   GET https://api.aisa.one/apis/v1/financial/prices?ticker=<TICKER>&start_date=<YYYY-MM-DD>&end_date=<YYYY-MM-DD>&interval=day
   Authorization: Bearer $AISA_API_KEY
   ```

   For example:

   ```
   curl -s -H "Authorization: Bearer $AISA_API_KEY" \
     "https://api.aisa.one/apis/v1/financial/prices?ticker=NVDA&start_date=2026-08-26&end_date=2026-08-27&interval=day"
   ```

   Take the `close` of the most recent bar. Always read the response body — the API reports failures in an `error` field of the JSON, not only via HTTP status.

2. Format the greeting with the returned close:

   ```
   bash scripts/greet.sh <name> <ticker> <close>
   ```

   Example: `bash scripts/greet.sh Trader NVDA 123.45` → `Hello, Trader! NVDA last close: 123.45 — greetings from the AIsa community. (2026-08-27T09:00:00Z)`

## External endpoints & requirements

- **Network endpoints called:** `GET https://api.aisa.one/apis/v1/financial/prices` (the AIsa `stock/prices` endpoint) — the only external call
- **Credentials/API keys required:** `AISA_API_KEY` (Bearer token with stock/prices access)
- **System dependencies:** bash, date, curl (or any HTTP client the agent already has)

*(A real skill must list every endpoint it talks to and every credential it needs — this section is mandatory, and reviewers verify that the endpoints declared in `skill.yaml` are genuinely used. See [SECURITY.md](../../SECURITY.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).)*
