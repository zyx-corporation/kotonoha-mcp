#!/usr/bin/env bash
# M5-P1a-3 (#131): documented local MCP E2E wrapper.
# See scripts/m5_mcp_e2e.ts and kotonoha-management docs/chatgpt-app/04_mcp_tools_and_ux.md §6
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "error: DATABASE_URL is required" >&2
  exit 1
fi

export KOTONOHA_BIN="${KOTONOHA_BIN:-../kotonoha-cli/target/release/kotonoha}"
export KOTONOHA_WORKDIR="${KOTONOHA_WORKDIR:-$(cd ../kotonoha-cli 2>/dev/null && pwd || pwd)}"

if [[ ! -f "$KOTONOHA_BIN" ]]; then
  echo "error: kotonoha binary not found: $KOTONOHA_BIN" >&2
  echo "  build: (cd kotonoha-cli && cargo build --release)" >&2
  exit 1
fi

npm run build
npm run test:e2e
