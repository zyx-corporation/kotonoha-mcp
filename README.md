# kotonoha-mcp

**MCP server** for the Kotonoha ecosystem. Tools delegate to the official [`kotonoha`](https://github.com/zyx-corporation/kotonoha-cli) CLI (no arbitrary shell execution).

**Track:** [#128](https://github.com/zyx-corporation/kotonoha-management/issues/128) · [#129](https://github.com/zyx-corporation/kotonoha-management/issues/129)–[#132](https://github.com/zyx-corporation/kotonoha-management/issues/132) · [#135](https://github.com/zyx-corporation/kotonoha-management/issues/135)

**Product UX contract:** [`04_mcp_tools_and_ux.md`](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md) — implementation guidance; not a replacement for `kotonoha-spec` normative SLS documents.

## Requirements

- **Node.js** ≥ 18
- **`kotonoha`** 0.2.6+ on `PATH`, or **`KOTONOHA_BIN`**
- DB tools: **`DATABASE_URL`** + `kotonoha db migrate`
- **`KOTONOHA_WORKDIR`**: Git repository root

## Quickstart

```bash
npm install && npm run build
export KOTONOHA_BIN="../kotonoha-cli/target/release/kotonoha"
export DATABASE_URL="postgres://..."
npm run test:cli
npm run test:e2e   # #131 — needs DATABASE_URL + Git workdir
npm start
```

### M5 MCP E2E (#131)

Equivalent to [`m5_agent_run_demo.sh`](https://github.com/zyx-corporation/kotonoha-cli/blob/main/scripts/m5_agent_run_demo.sh):

```bash
export DATABASE_URL="postgres://..."
export KOTONOHA_BIN="../kotonoha-cli/target/release/kotonoha"
export KOTONOHA_WORKDIR="../kotonoha-cli"
./scripts/m5_mcp_e2e.sh
```

Steps 1–6, human review prep, and human **approve** use **MCP tools**; step 7 (agent deny) uses **CLI** only. CI: [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml).

## MCP tools

| Tool | CLI delegation | Capability |
| --- | --- | --- |
| `kotonoha_ping` | `kotonoha version` | health |
| `kotonoha_context_export` | `kotonoha context export FILE` | readonly |
| `kotonoha_rde_validate` | `kotonoha rde validate --strict` (stdin) | readonly |
| `kotonoha_agent_record_start` | `kotonoha agent record start` | agent |
| `kotonoha_agent_record_complete` | `kotonoha agent record complete --run-id` | agent |
| `kotonoha_meaning_delta_from_run` | `kotonoha agent delta create` | agent |
| `kotonoha_rde_attach` | `kotonoha rde attach --source-kind llm` | agent |
| `kotonoha_prepare_human_review` | `kotonoha export --format m2` + Approve UI package | **#135 + #136** |
| `kotonoha_copy_human_review_command` | *(no CLI exec)* human-only command string | **human prep** |
| `kotonoha_review_approve` / `hold` / `reject` | `kotonoha review *` (**human path** · no `--agent-run-id`) | **#136** |

**Not exposed:** autonomous `review.*` with `agent_run_id`, `git.push`, `git.commit`, `shell`.

**Security contract:** Only [`src/kotonoha.ts`](src/kotonoha.ts) spawns the `kotonoha` binary — no arbitrary shell ([`docs/mcp-server-contract.md`](docs/mcp-server-contract.md), `npm run contract:cli-only`).

## Agent Approve UI (#136)

Resource: `ui://kotonoha/human-review` · Tools: `kotonoha_review_approve`, `kotonoha_review_hold`, `kotonoha_review_reject`.

Human clicks Approve/Hold/Reject in the widget; MCP calls CLI **without** `--agent-run-id` and **without** `KOTONOHA_AGENT_RUN_ID` in the child env.

See [`docs/ui-design-review-m5-agent-approve.md`](docs/ui-design-review-m5-agent-approve.md).

## Human Review Preparation (#135)

After the agent flow, call `kotonoha_prepare_human_review` with `delta_id` (and optional `assessment_id`, `agent_run_id`). The response includes:

- Status lines ending with **Human approval pending**
- `copy_cli_review_command` **without** `--agent-run-id`
- M2 export JSON for review

See [`docs/ui-design-review-m5-p1-human-review.md`](docs/ui-design-review-m5-p1-human-review.md).

## RDE summary widget (#132)

| Resource | `ui://kotonoha/rde-summary` |
| --- | --- |
| MIME | `text/html;profile=mcp-app` |
| Tools | `kotonoha_rde_validate`, `kotonoha_rde_attach` (via `_meta.ui.resourceUri`) |
| Payload | `kotonoha.rde_summary.v0.1` in `structuredContent` — validated categories or §4.3 error |

Design record: [`docs/ui-design-review-m5-impl.md`](docs/ui-design-review-m5-impl.md).

## Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "kotonoha": {
      "command": "node",
      "args": ["/path/to/kotonoha-mcp/dist/index.js"],
      "env": {
        "KOTONOHA_BIN": "/path/to/kotonoha",
        "KOTONOHA_WORKDIR": "/path/to/git-repo",
        "DATABASE_URL": "postgres://..."
      }
    }
  }
}
```

## License

Apache-2.0 — see [LICENSE](LICENSE).
