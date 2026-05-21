/**
 * M5-P1a-3 (#131): MCP client E2E — equivalent to kotonoha-cli/scripts/m5_agent_run_demo.sh
 *
 * Steps 1–6 + human review prep: MCP tools via stdio client.
 * Steps 7–8 (review approve): CLI only — MCP intentionally has no review.* tools (#135).
 *
 * Usage:
 *   export DATABASE_URL=postgres://...
 *   export KOTONOHA_BIN=/path/to/kotonoha
 *   export KOTONOHA_WORKDIR=/path/to/git-repo   # default: kotonoha-cli if sibling exists
 *   npm run test:e2e
 *
 * See: kotonoha-management docs/chatgpt-app/04_mcp_tools_and_ux.md §6
 */

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { exitCodeLabel, resolveKotonohaBin, runKotonoha } from "../src/kotonoha.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mcpRoot = join(scriptDir, "..");
const serverEntry = join(mcpRoot, "dist", "index.js");

type ToolPayload = {
  exit_code?: number;
  exit_label?: string;
  stdout?: string;
  stderr?: string;
  agent_run_id?: string;
  meaning_delta_id?: string;
  rde_assessment_id?: string;
  format?: string;
  hint_en?: string;
  [key: string]: unknown;
};

function parseToolPayload(result: {
  content?: { type: string; text?: string }[];
  isError?: boolean;
}): ToolPayload {
  const block = result.content?.find((c) => c.type === "text");
  assert.ok(block?.text, "tool result missing text content");
  return JSON.parse(block.text) as ToolPayload;
}

function resolveDefaultWorkdir(): string {
  const explicit = process.env.KOTONOHA_WORKDIR?.trim();
  if (explicit) {
    return explicit;
  }
  const siblingCli = join(mcpRoot, "..", "kotonoha-cli");
  return siblingCli;
}

async function main(): Promise<void> {
  const bin = resolveKotonohaBin();
  const workdir = resolveDefaultWorkdir();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.error("error: DATABASE_URL is required for M5 MCP E2E");
    process.exit(1);
  }

  console.log(`== M5 MCP E2E ==`);
  console.log(`KOTONOHA_BIN=${bin}`);
  console.log(`KOTONOHA_WORKDIR=${workdir}`);
  console.log(`MCP server=${serverEntry}`);

  await runKotonoha({ args: ["db", "migrate"], cwd: workdir });

  const demoRel = process.env.M5_DEMO_FILE?.trim() || "docs/m5_mcp_e2e_scratch.md";
  const demoAbs = join(workdir, demoRel);
  await mkdir(dirname(demoAbs), { recursive: true });
  await writeFile(
    demoAbs,
    `# M5 MCP E2E ${new Date().toISOString()}\n`,
    "utf8",
  );

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    cwd: workdir,
    env: {
      ...process.env,
      KOTONOHA_BIN: bin,
      KOTONOHA_WORKDIR: workdir,
      DATABASE_URL: databaseUrl,
    },
    stderr: "pipe",
  });

  const client = new Client({ name: "m5-mcp-e2e", version: "0.2.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  const names = new Set(tools.tools.map((t) => t.name));
  for (const forbidden of ["review.approve", "kotonoha_git_push"]) {
    assert.ok(!names.has(forbidden), `forbidden tool registered: ${forbidden}`);
  }
  for (const required of [
    "kotonoha_review_approve",
    "kotonoha_review_hold",
    "kotonoha_review_reject",
  ]) {
    assert.ok(names.has(required), `missing human review tool: ${required}`);
  }
  const approveTool = tools.tools.find((t) => t.name === "kotonoha_review_approve");
  const schemaJson = JSON.stringify(approveTool?.inputSchema ?? {});
  assert.ok(!schemaJson.includes("agent_run_id"), "review tool must not expose agent_run_id");
  console.log("ok: human review MCP tools present; no autonomous git/review.approve alias");

  console.log("--- Step 1: kotonoha_context_export (MCP) ---");
  const ctxResult = await client.callTool({
    name: "kotonoha_context_export",
    arguments: { file: demoRel },
  });
  const ctx = parseToolPayload(ctxResult);
  assert.equal(ctx.exit_code, 0, `context export failed: ${JSON.stringify(ctx)}`);
  assert.match(ctx.stdout ?? "", /kotonoha\.context_pack\.v0\.1/);
  console.log("ok: context pack v0.1");

  console.log("--- Step 2: rde emit (CLI) + kotonoha_rde_validate (MCP) ---");
  const emit = await runKotonoha({ args: ["rde", "emit"], cwd: workdir });
  assert.equal(emit.exitCode, 0);
  const validateResult = await client.callTool({
    name: "kotonoha_rde_validate",
    arguments: { rde_json: emit.stdout },
  });
  const validated = parseToolPayload(validateResult);
  assert.equal(validated.exit_code, 0);
  assert.equal(validated.exit_label, exitCodeLabel(0));
  console.log("ok: rde validate exit 0");

  console.log("--- §4.5 probe: invalid RDE → exit 2 via MCP ---");
  const badValidate = await client.callTool({
    name: "kotonoha_rde_validate",
    arguments: { rde_json: "{}" },
  });
  assert.equal(badValidate.isError, true, "expected isError for validation failure");
  const badPayload = parseToolPayload(badValidate);
  assert.equal(badPayload.exit_code, 2);
  assert.equal(badPayload.exit_label, exitCodeLabel(2));
  console.log("ok: exit 2 mapped to MCP client");

  const rdeJson = emit.stdout;

  console.log("--- Step 3: kotonoha_agent_record_start (MCP) ---");
  const startResult = await client.callTool({
    name: "kotonoha_agent_record_start",
    arguments: {
      agent_kind: "m5-mcp-e2e",
      external_ref: `mcp-e2e-${Date.now()}`,
    },
  });
  const started = parseToolPayload(startResult);
  assert.equal(started.exit_code, 0);
  const runId = started.agent_run_id ?? started.stdout;
  assert.match(runId ?? "", /^[0-9a-f-]{36}$/i);
  console.log(`agent_run_id: ${runId}`);

  const obs = JSON.stringify({
    preserved: ["intent"],
    intended_change: "M5 MCP E2E observation",
  });

  console.log("--- Step 4: kotonoha_meaning_delta_from_run (MCP) ---");
  const deltaResult = await client.callTool({
    name: "kotonoha_meaning_delta_from_run",
    arguments: {
      file: demoRel,
      agent_run_id: runId,
      observation_json: obs,
    },
  });
  const deltaPayload = parseToolPayload(deltaResult);
  assert.equal(deltaPayload.exit_code, 0);
  const deltaId = deltaPayload.meaning_delta_id ?? deltaPayload.stdout;
  assert.match(deltaId ?? "", /^[0-9a-f-]{36}$/i);
  console.log(`meaning_delta_id: ${deltaId}`);

  console.log("--- Step 5: kotonoha_rde_attach (MCP) ---");
  const attachResult = await client.callTool({
    name: "kotonoha_rde_attach",
    arguments: { delta_id: deltaId, rde_json: rdeJson, strict: true },
  });
  const attachPayload = parseToolPayload(attachResult);
  assert.equal(attachPayload.exit_code, 0);
  const assessmentId = attachPayload.rde_assessment_id ?? attachPayload.stdout;
  assert.match(assessmentId ?? "", /^[0-9a-f-]{36}$/i);
  console.log(`rde_assessment_id: ${assessmentId}`);

  console.log("--- Step 6: kotonoha_agent_record_complete (MCP) ---");
  const completeResult = await client.callTool({
    name: "kotonoha_agent_record_complete",
    arguments: { run_id: runId },
  });
  const completePayload = parseToolPayload(completeResult);
  assert.equal(completePayload.exit_code, 0);
  console.log("ok: agent record complete");

  console.log("--- #135: kotonoha_prepare_human_review (MCP, before human approve) ---");
  const prepResult = await client.callTool({
    name: "kotonoha_prepare_human_review",
    arguments: {
      delta_id: deltaId,
      assessment_id: assessmentId,
      agent_run_id: runId,
    },
  });
  const prep = parseToolPayload(prepResult);
  assert.equal(prep.format, "kotonoha.human_review_package.v0.1");
  const statusEn = prep.status_summary_en as string[] | undefined;
  assert.ok(
    statusEn?.some((s) => s.includes("Human approval pending")),
    `expected Human approval pending, got ${JSON.stringify(statusEn)}`,
  );
  const copyCmd = String(
    (prep.next_actions as { copy_cli_review_command?: string } | undefined)
      ?.copy_cli_review_command ?? "",
  );
  assert.ok(!copyCmd.includes("--agent-run-id"), "human CLI must omit --agent-run-id");
  console.log("ok: human review package");

  console.log("--- Step 7: agent review approve deny (CLI — no MCP tool) ---");
  const deny = await runKotonoha({
    args: [
      "review",
      "approve",
      "--delta-id",
      deltaId!,
      "--assessment-id",
      assessmentId!,
      "--agent-run-id",
      runId!,
      "--decided-by",
      "agent-bot",
    ],
    cwd: workdir,
  });
  assert.equal(deny.exitCode, 2, `expected exit 2, got ${deny.exitCode}`);
  assert.match(deny.stderr, /denied_actions/);
  console.log("ok: capability deny exit 2");

  console.log("--- Step 8: kotonoha_review_approve (MCP human path) ---");
  const approveResult = await client.callTool({
    name: "kotonoha_review_approve",
    arguments: {
      delta_id: deltaId,
      assessment_id: assessmentId,
      decided_by: "human-reviewer",
    },
  });
  const approved = parseToolPayload(approveResult);
  assert.equal(approved.exit_code, 0, JSON.stringify(approved));
  const hr = approved.human_review as { review_decision_id?: string } | undefined;
  const decisionId = hr?.review_decision_id ?? approved.stdout;
  assert.match(String(decisionId), /^[0-9a-f-]{36}$/i);
  console.log(`review_decision_id: ${decisionId}`);

  await transport.close();
  console.log("== M5 MCP E2E complete ==");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
