# kotonoha-mcp

**MCP server** for the Kotonoha ecosystem. Tools delegate to the official [`kotonoha`](https://github.com/zyx-corporation/kotonoha-cli) CLI (no arbitrary shell execution).

**Track:** [kotonoha-management#129](https://github.com/zyx-corporation/kotonoha-management/issues/129) (M5-P1a-1 scaffold) · parent [#128](https://github.com/zyx-corporation/kotonoha-management/issues/128)

**Normative UX:** [`04_mcp_tools_and_ux.md`](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md)

## Requirements

- **Node.js** ≥ 18
- **`kotonoha`** on `PATH`, or **`KOTONOHA_BIN`** pointing to the binary (e.g. `kotonoha-cli/target/release/kotonoha`)
- For DB-backed tools (M5-P1a-2+): **`DATABASE_URL`** and M5 migrations (`kotonoha db migrate`)
- **`KOTONOHA_WORKDIR`**: Git repository root for `context export` / `delta create` (defaults to process cwd)

## Quickstart

```bash
npm install
npm run build

# Verify CLI subprocess (no MCP client required)
export KOTONOHA_BIN="../kotonoha-cli/target/release/kotonoha"
npm run test:cli

# Run MCP server (stdio — for Cursor, Claude Desktop, MCP Inspector)
npm start
```

### Cursor / Claude Desktop (stdio)

Add to MCP settings (paths adjusted to your machine):

```json
{
  "mcpServers": {
    "kotonoha": {
      "command": "node",
      "args": ["/absolute/path/to/kotonoha-mcp/dist/index.js"],
      "env": {
        "KOTONOHA_BIN": "/absolute/path/to/kotonoha-cli/target/release/kotonoha",
        "KOTONOHA_WORKDIR": "/absolute/path/to/your/git-repo",
        "DATABASE_URL": "postgres://kotonoha:kotonoha@localhost:5433/kotonoha_test"
      }
    }
  }
}
```

## Tools (scaffold)

| MCP tool | CLI (today) | Notes |
| --- | --- | --- |
| `kotonoha_ping` | `kotonoha version` | **#129** smoke only |

Full tool set (`kotonoha_context_export`, `kotonoha_agent_record_*`, …): [#130](https://github.com/zyx-corporation/kotonoha-management/issues/130).

## Exit codes

CLI exit codes are echoed in tool JSON (`exit_code`, `exit_label`). See [`04` §4.5](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md).

## License

Apache-2.0 — see [LICENSE](LICENSE).
