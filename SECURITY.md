# Security Policy

This registry hosts **metadata only** — every submitted product lives in its author's own repository. The gallery is a showcase, **not an endorsement or a security audit**: read a product's code and documentation before running it.

## Listing policy

A submission is removed (and repeat offenses banned) if the product it links to:

1. **Is malicious or deceptive** — malware, credential harvesting, hidden data exfiltration, or functionality that materially differs from its description.
2. **Hides financial-transaction capability.** Products that can execute financial transactions (trading, transfers, payments, crypto) are allowed only if their own README warns users prominently that real money or assets can move, and transaction paths require explicit user confirmation by default. Concealing this is treated as malicious.
3. **Ships secrets in this repo** — API keys, tokens, or private keys in the submission metadata (CI scans for these).
4. **Misdeclares its AIsa usage** — endpoints listed in `aisa_endpoints_used` that the product doesn't call, discovered at review or later.

## What CI checks vs. what humans check

- **CI (automated, best-effort):** schema validity, secret patterns in submitted metadata, endpoint-declaration sanity.
- **Maintainers:** the linked repo is public and real, the description is honest, and the declared AIsa endpoints are genuinely used.

## Reporting

- **Malicious or deceptive listing:** open a private report via GitHub's *Report a vulnerability* (Security tab), or contact the maintainers. Do **not** open a public issue with exploit details first.
- **Vulnerability in the repo tooling** (validators, workflows): same channel.

We aim to acknowledge reports within 72 hours. Confirmed malicious listings are removed immediately.

## Workflow security

GitHub Actions in this repo run with minimal permissions; workflows triggered by fork PRs never expose secrets to submitted content.
