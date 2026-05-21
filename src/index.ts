#!/usr/bin/env node
/**
 * Kotonoha MCP server (stdio) — delegates to `kotonoha` CLI.
 * #129 scaffold · #130 tools · #135 human review preparation UI.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { i18n } from "./i18n.js";
import { registerHumanReviewTools } from "./register-review-tools.js";
import { registerKotonohaTools } from "./register-tools.js";
import { resolveKotonohaBin, resolveWorkdir } from "./kotonoha.js";
import { registerRdeSummaryWidget } from "./widget.js";

const server = new McpServer(
  {
    name: "kotonoha-mcp",
    version: "0.4.0",
  },
  {
    instructions: [
      i18n.agentPrepareEn,
      i18n.agentPrepareJa,
      i18n.humanBannerEn,
      i18n.humanBannerJa,
      "Agent channel prepares work; humans approve via M3 or `kotonoha review` WITHOUT --agent-run-id.",
      "Human review: kotonoha_review_approve|hold|reject (human path only; no --agent-run-id).",
      "Tools invoke the local `kotonoha` CLI only (no arbitrary shell).",
      `CLI: ${resolveKotonohaBin()}. Workdir: ${resolveWorkdir()}.`,
      "Env: KOTONOHA_BIN, KOTONOHA_WORKDIR, DATABASE_URL, KOTONOHA_PRINCIPAL_ID, KOTONOHA_PROJECT_ID (M6).",
    ].join("\n"),
  },
);

registerRdeSummaryWidget(server);
registerKotonohaTools(server);
registerHumanReviewTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
