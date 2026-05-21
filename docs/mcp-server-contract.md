# MCP server contract (M5-P1b-3)

## CLI delegation only

| Rule | Detail |
| --- | --- |
| **Process spawn** | Only [`src/kotonoha.ts`](../src/kotonoha.ts) may call `child_process.spawn` |
| **Binary** | Resolved via `KOTONOHA_BIN` or `kotonoha` on `PATH` |
| **Forbidden** | Arbitrary shell, `git`, `gh`, `review` MCP tools |

## Review checklist (PR)

- [ ] No new `spawn` / `exec` outside `kotonoha.ts`
- [ ] New MCP tools map 1:1 to documented `kotonoha` subcommands
- [ ] No `review.approve` / `review.hold` / `review.reject` tools
- [ ] Run `npm run contract:cli-only`

## CI

[`scripts/contract-cli-only.sh`](../scripts/contract-cli-only.sh) runs in [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml).
