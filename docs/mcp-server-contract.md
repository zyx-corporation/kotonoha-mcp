# MCP server contract (M5-P1b-3)

## CLI delegation only

| Rule | Detail |
| --- | --- |
| **Process spawn** | Only [`src/kotonoha.ts`](../src/kotonoha.ts) may call `child_process.spawn` |
| **Binary** | Resolved via `KOTONOHA_BIN` or `kotonoha` on `PATH` |
| **Forbidden** | Arbitrary shell, direct `git`, direct `gh`, autonomous review with `--agent-run-id` or `KOTONOHA_AGENT_RUN_ID` |
| **Allowed review path** | Human-path review tools may call `kotonoha review approve|hold|reject` only without `--agent-run-id` and with agent context cleared. |

## Review checklist (PR)

- [ ] No new `spawn` / `exec` outside `kotonoha.ts`
- [ ] New MCP tools map 1:1 to documented `kotonoha` subcommands
- [ ] Human review tools do not pass `--agent-run-id`
- [ ] Human review tools clear `KOTONOHA_AGENT_RUN_ID` from child process environment
- [ ] No autonomous `review.approve` / `review.hold` / `review.reject` tools
- [ ] Run `npm run contract:cli-only`

## CI

[`scripts/contract-cli-only.sh`](../scripts/contract-cli-only.sh) runs in [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml).
