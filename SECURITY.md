# Security Policy

Community skills are **executable code** that other people will run inside their AIsa agents. This policy is what keeps the registry trustworthy.

## Rules for vendored skills

A skill PR will be rejected (and repeat offenses banned) if it:

1. **Downloads and executes code at runtime** — no `curl | sh`, no fetching scripts to `eval`, no self-updating payloads.
2. **Reads credentials beyond its declared requirements** — no touching `~/.ssh`, `~/.aws`, keychains, browser profiles, or environment variables it didn't declare in `requirements`.
3. **Exfiltrates data** — every network endpoint the skill talks to must be documented in `SKILL.md`.
4. **Contains obfuscated code** — base64-encoded logic, packed strings, minified-only sources. Reviewers must be able to read everything.
5. **Ships secrets** — API keys, tokens, or private keys in any file.
6. **Performs destructive operations** outside its own working directory without an explicit, documented user confirmation step.
7. **Mines or spams** — no cryptominers, no bulk messaging.

## Financial-transaction skills and projects

Submissions that can execute financial transactions — trading, transfers, payments, crypto operations — are **allowed, but must warn the user**. Concretely:

- `SKILL.md` (or the project's README) must open with a prominent **⚠️ warning** that the software can move real money or assets, and describe the worst-case outcome (e.g. total loss of funds it can access).
- Every transaction path must require an **explicit user confirmation step by default**. Fully unattended execution may exist only as a documented, off-by-default opt-in.
- Every venue, broker, exchange, or chain the software touches — and every credential it needs — must be declared in `requirements` and documented in `SKILL.md`.
- Inclusion in this registry is **not an endorsement and not investment advice**; users transact entirely at their own risk.

A submission that hides transaction capability, or defaults to unattended execution without these disclosures, is treated as malicious under this policy.

## What CI checks vs. what humans check

- **CI (automated, best-effort):** schema validity, secret patterns, known dangerous shell patterns, file size limits.
- **Maintainers:** full read of the code, verification that `SKILL.md` documents all endpoints and requirements, license sanity.

Automated scanning is a floor, not a guarantee. **You should still read a skill's code before installing it**.

## Reporting a vulnerability or malicious submission

- **Malicious or suspicious skill in the registry:** open a private report via GitHub's *Report a vulnerability* (Security tab), or email the maintainers. Do **not** open a public issue with exploit details first.
- **Vulnerability in the repo tooling** (validators, workflows): same channel.

We aim to acknowledge reports within 72 hours. Confirmed malicious submissions are removed immediately and the incident is disclosed in the affected skill's folder.

## Scope notes

- Projects (metadata-only entries) link to external repos we don't control — the gallery is a showcase, **not an endorsement or audit**.
- GitHub Actions in this repo run with minimal permissions; workflows triggered by fork PRs never expose secrets to submitted code.
