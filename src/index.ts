#!/usr/bin/env node
/**
 * Kotonoha MCP server (stdio) — delegates tools to `kotonoha` CLI.
 * Parent: https://github.com/zyx-corporation/kotonoha-management/issues/128
 * Scaffold: https://github.com/zyx-corporation/kotonoha-management/issues/129
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  exitCodeLabel,
  resolveKotonohaBin,
  resolveWorkdir,
  runKotonoha,
} from "./kotonoha.js";

const HUMAN_RESPONSIBILITY_EN =
  "RDE assessments support review; they do not replace human judgment.";
const HUMAN_RESPONSIBILITY_JA =
  "RDE はレビューを支援します。最終判断の代替ではありません（人間責任）。";

function toolResultFromCli(
  result: Awaited<ReturnType<typeof runKotonoha>>,
): {
  content: { type: "text"; text: string }[];
  isError?: boolean;
} {
  const label = exitCodeLabel(result.exitCode);
  const payload = {
    exit_code: result.exitCode,
    exit_label: label,
    stdout: result.stdout.trimEnd(),
    stderr: result.stderr.trimEnd(),
  };
  const text = JSON.stringify(payload, null, 2);
  return {
    content: [{ type: "text", text }],
    ...(result.exitCode !== 0 ? { isError: true } : {}),
  };
}

const server = new McpServer(
  {
    name: "kotonoha-mcp",
    version: "0.1.0",
  },
  {
    instructions: [
      HUMAN_RESPONSIBILITY_EN,
      HUMAN_RESPONSIBILITY_JA,
      "Tools invoke the local `kotonoha` CLI only (no arbitrary shell).",
      `CLI binary: ${resolveKotonohaBin()}. Workdir: ${resolveWorkdir()}.`,
      "Set KOTONOHA_BIN, KOTONOHA_WORKDIR, DATABASE_URL in the MCP host environment.",
    ].join("\n"),
  },
);

/** Scaffold tool — proves subprocess wiring (#129). Full tool set: #130. */
server.registerTool(
  "kotonoha_ping",
  {
    title: "Kotonoha CLI ping",
    description:
      "Run `kotonoha version` to verify CLI availability (KOTONOHA_BIN / PATH).",
    inputSchema: z.object({}),
  },
  async () => {
    const result = await runKotonoha({ args: ["version"] });
    return toolResultFromCli(result);
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
