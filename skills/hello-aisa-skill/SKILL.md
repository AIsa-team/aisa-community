---
name: hello-aisa-skill
description: Prints a greeting with the current UTC time. Seed example demonstrating the community skill format — copy its structure, not its content.
---

# Hello AIsa Skill

> This is the **seed example** for the community skill format. It follows the [SKILL.md frontmatter spec](https://www.skillsdirectory.com/docs/skill-md-format) and the [skill file structure](https://www.skillsdirectory.com/docs/skill-file-structure).

## What it does

Prints a greeting with the current UTC time. That's it — it exists to demonstrate the minimum viable skill submission: registry metadata (`skill.yaml`), this SKILL.md with frontmatter, and a small, readable script in `scripts/`.

## When an agent should use it

Never, in practice — it's a format demo. A real description (and this section) should name concrete trigger phrases or situations, e.g. *"invoke when the user asks for spot FX rates."*

## Usage

```
bash scripts/greet.sh [name]
```

Example: `bash scripts/greet.sh Trader` → `Hello, Trader! Greetings from the AIsa community. (2026-08-27T09:00:00Z)`

## External endpoints & requirements

- **Network endpoints called:** none
- **Credentials/API keys required:** none
- **System dependencies:** bash, date

*(A real skill must list every endpoint it talks to and every credential it needs — this section is mandatory. See [SECURITY.md](../../SECURITY.md).)*
