#!/usr/bin/env bash
# Hello AIsa — example community skill entrypoint.
# Prints a greeting with the current UTC timestamp. No network, no credentials.
set -euo pipefail

NAME="${1:-friend}"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Hello, ${NAME}! Greetings from the AIsa community. (${NOW})"
