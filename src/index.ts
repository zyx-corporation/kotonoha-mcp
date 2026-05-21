#!/usr/bin/env node
/**
 * Kotonoha MCP server (stdio) — delegates to `kotonoha` CLI.
 * #129 scaffold · #130 tools · #135 human review preparation UI.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { i18n } from "./i18n.js";
import { registerKotonohaTools } from "./register-tools.js";
import { resolveKotonohaBin, resolveWorkdir } from "./kotonoha.js";

const server = new McpServer(
  {
    name: "kotonoha-mcp",
    version: "0.2.0",
  },
  {
    instructions: [
      i18n.agentPrepareEn,
      i18n.agentPrepareJa,
      i18n.humanBannerEn,
      i18n.humanBannerJa,
      "Agent channel prepares work; humans approve via M3 or `kotonoha review` WITHOUT --agent-run-id.",
      "No review.approve / review.hold / review.reject MCP tools.",
      "Tools invoke the local `kotonoha` CLI only (no arbitrary shell).",
      `CLI: ${resolveKotonohaBin()}. Workdir: ${resolveWorkdir()}.`,
      "Env: KOTONOHA_BIN, KOTONOHA_WORKDIR, DATABASE_URL.",
    ].join("\n"),
  },
);

registerKotonohaTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
