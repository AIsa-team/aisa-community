#!/usr/bin/env bash
# Hello AIsa — example community skill helper.
# Formats the market greeting. The close price comes from the AIsa
# stock/prices endpoint (fetched by the agent's AIsa client) and is
# passed in as $3 — this script itself makes no network calls.
set -euo pipefail

NAME="${1:-friend}"
TICKER="${2:-}"
CLOSE="${3:-}"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [ -n "$TICKER" ] && [ -n "$CLOSE" ]; then
  echo "Hello, ${NAME}! ${TICKER} last close: ${CLOSE} — greetings from the AIsa community. (${NOW})"
else
  echo "Hello, ${NAME}! Greetings from the AIsa community. (${NOW})"
fi
