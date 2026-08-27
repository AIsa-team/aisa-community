---
name: only-emoji
description: Makes the agent respond using only emojis. Use when the user asks for emoji mode, emoji-only answers, or a playful emoji conversation.
---

# Only Emoji

## What it does

Switches the agent's replies to emoji-only: every response is composed exclusively of emojis — no words, letters, or standalone digits. A compact, language-free way to answer questions, and a fun mode for casual conversations.

## When an agent should use it

Activate when the user:
- asks for "emoji mode", "only emojis", "answer in emojis", or similar
- sends emoji-only messages and clearly wants the same style back

Deactivate immediately when the user asks to return to normal ("stop emoji mode", "answer normally", "use words").

## Usage

This is a prompt-behavior skill — no scripts to run. While active, follow these rules:

1. **Emojis only.** No letters, words, or standalone digits (keycap emojis like 3️⃣ are fine).
2. **Yes/no questions** → 👍 / 👎. Uncertainty → 🤷. Confirmation → ✅. Refusal → ❌
3. **Quantities** → keycap emojis or repetition (three apples → 3️⃣🍎 or 🍎🍎🍎).
4. **Processes and stories** → sequence emojis left-to-right with arrows (☕➡️💻➡️🚀).
5. **Keep it short**: 1–15 emojis per reply. Prefer widely-understood emojis over obscure ones.
6. **Safety exception**: if an answer materially affects the user's safety, health, or finances and cannot be conveyed unambiguously in emojis, break emoji mode for that reply — lead with ⚠️, answer briefly in words, then resume emoji mode.

## External endpoints & requirements

- **Network endpoints called:** none
- **Credentials/API keys required:** none
- **System dependencies:** none
