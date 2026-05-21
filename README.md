# kotonoha-mcp

**MCP server** for the Kotonoha ecosystem. Tools delegate to the official [`kotonoha`](https://github.com/zyx-corporation/kotonoha-cli) CLI (no arbitrary shell execution).

**Track:** [#128](https://github.com/zyx-corporation/kotonoha-management/issues/128) · [#129](https://github.com/zyx-corporation/kotonoha-management/issues/129) scaffold · [#130](https://github.com/zyx-corporation/kotonoha-management/issues/130) tools · [#135](https://github.com/zyx-corporation/kotonoha-management/issues/135) human review prep UI

**Normative UX:** [`04_mcp_tools_and_ux.md`](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md)

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
npm start
```

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
| `kotonoha_prepare_human_review` | `kotonoha export --format m2` + package | **human prep (#135)** |
| `kotonoha_copy_human_review_command` | *(no CLI exec)* human-only command string | **human prep** |

**Not exposed:** `review.approve`, `review.hold`, `review.reject`, `git.push`, `git.commit`, `shell`.

## Human Review Preparation (#135)

After the agent flow, call `kotonoha_prepare_human_review` with `delta_id` (and optional `assessment_id`, `agent_run_id`). The response includes:

- Status lines ending with **Human approval pending**
- `copy_cli_review_command` **without** `--agent-run-id`
- M2 export JSON for review

See [`docs/ui-design-review-m5-p1-human-review.md`](docs/ui-design-review-m5-p1-human-review.md).

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
