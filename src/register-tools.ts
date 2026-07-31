/**
 * MCP tools delegating to `kotonoha` CLI — #130 + #135.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { prepareHumanReviewPackage, buildHumanReviewApproveCommand } from "./human-review.js";
import { i18n, toolDescription } from "./i18n.js";
import {
  runKotonoha,
  toolResultFromCli,
  withTempJsonFile,
} from "./kotonoha.js";
import {
  buildValidationErrorSummary,
  parseValidatedRdeSummary,
  toolResultWithRdeSummary,
} from "./rde-summary.js";
import { HUMAN_REVIEW_WIDGET_URI, RDE_SUMMARY_WIDGET_URI } from "./widget.js";

const uuid = z.string().uuid();
const optionalObservationJson = z
  .string()
  .optional()
  .describe("Optional observation JSON string for meaning_delta_draft");

export function registerKotonohaTools(server: McpServer): void {
  server.registerTool(
    "kotonoha_ping",
    {
      title: "Kotonoha CLI ping",
      description: toolDescription(
        "Run `kotonoha version` to verify CLI availability.",
        "CLI の接続確認（`kotonoha version`）。",
      ),
      inputSchema: z.object({}),
    },
    async () => toolResultFromCli(await runKotonoha({ args: ["version"] })),
  );

  server.registerTool(
    "kotonoha_context_export",
    {
      title: "Export context pack",
      description: toolDescription(
        "Export Git anchor and optional meaning-change draft as kotonoha.context_pack.v0.1 JSON. No database required.",
        "Git アンカーと ΔM 草案を context pack JSON で返す（DATABASE_URL 不要）。",
      ),
      inputSchema: z.object({
        file: z.string().describe("Repo-relative file path"),
        line_start: z.number().int().optional(),
        line_end: z.number().int().optional(),
        diff_ref: z.string().optional(),
        observation_json: optionalObservationJson,
        repo_path: z
          .string()
          .optional()
          .describe("Git repo root (default KOTONOHA_WORKDIR)"),
      }),
    },
    async ({ file, line_start, line_end, diff_ref, observation_json, repo_path }) => {
      const args = ["context", "export", file];
      if (line_start !== undefined) {
        args.push("--line-start", String(line_start));
      }
      if (line_end !== undefined) {
        args.push("--line-end", String(line_end));
      }
      if (diff_ref) {
        args.push("--diff-ref", diff_ref);
      }
      if (observation_json?.trim()) {
        return toolResultFromCli(
          await withTempJsonFile(observation_json, (obsPath) =>
            runKotonoha({
              args: [...args, "--observation", obsPath],
              cwd: repo_path,
            }),
          ),
        );
      }
      return toolResultFromCli(
        await runKotonoha({ args, cwd: repo_path }),
      );
    },
  );

  server.registerTool(
    "kotonoha_rde_draft",
    {
      title: "Draft RDE from MeaningDelta",
      description: toolDescription(
        "Draft provider-neutral RDE candidate JSON from a MeaningDelta. Assistance only; human review is still required.",
        "MeaningDelta から RDE 候補 JSON を下書き生成（支援のみ・人間レビュー必須）。",
      ),
      inputSchema: z.object({
        delta_id: uuid,
        wrap: z
          .boolean()
          .optional()
          .default(false)
          .describe("Return draft metadata wrapper instead of raw attachable RDE JSON"),
      }),
      _meta: {
        ui: { resourceUri: RDE_SUMMARY_WIDGET_URI },
        "openai/outputTemplate": RDE_SUMMARY_WIDGET_URI,
        "openai/toolInvocation/invoking": "Drafting RDE…",
        "openai/toolInvocation/invoked": "RDE draft ready",
      },
    },
    async ({ delta_id, wrap }) => {
      const args = ["rde", "draft", "--delta-id", delta_id];
      if (wrap) {
        args.push("--wrap");
      }
      const result = await runKotonoha({ args });
      if (result.exitCode === 0 && !wrap) {
        const summary = parseValidatedRdeSummary(result.stdout);
        if (summary) {
          return toolResultWithRdeSummary(
            result,
            summary,
            {
              rde_json: result.stdout.trimEnd(),
              boundary_en:
                "Draft assistance is not approval; validate, attach, then record human review separately.",
              boundary_ja:
                "下書き支援は承認ではありません。検証・attach 後、人間レビューを別途記録してください。",
            },
            RDE_SUMMARY_WIDGET_URI,
          );
        }
      }
      return toolResultFromCli(result, {
        ...(result.exitCode === 0
          ? { rde_json: result.stdout.trimEnd() }
          : {}),
      });
    },
  );

  server.registerTool(
    "kotonoha_rde_validate",
    {
      title: "Validate RDE JSON",
      description: toolDescription(
        "Validate RDE review output JSON with --strict before attach.",
        "RDE JSON を --strict で検証（attach 前）。",
      ),
      inputSchema: z.object({
        rde_json: z.string().describe("RDE review output JSON string"),
      }),
      _meta: {
        ui: { resourceUri: RDE_SUMMARY_WIDGET_URI },
        "openai/outputTemplate": RDE_SUMMARY_WIDGET_URI,
        "openai/toolInvocation/invoking": "Validating RDE…",
        "openai/toolInvocation/invoked": "RDE validation complete",
      },
    },
    async ({ rde_json }) => {
      const result = await runKotonoha({
        args: ["rde", "validate", "--strict"],
        stdin: rde_json,
      });
      if (result.exitCode === 0) {
        const summary = parseValidatedRdeSummary(rde_json);
        if (summary) {
          return toolResultWithRdeSummary(
            result,
            summary,
            undefined,
            RDE_SUMMARY_WIDGET_URI,
          );
        }
        return toolResultFromCli(result, {
          hint_en: "Validation passed but RDE summary could not be parsed for the widget.",
          hint_ja: "検証は成功しましたがウィジェット用要約を解析できませんでした。",
        });
      }
      const hints =
        result.exitCode === 2
          ? { hint_en: i18n.validateFailedEn, hint_ja: i18n.validateFailedJa }
          : {};
      const summary = buildValidationErrorSummary(result, hints);
      return toolResultWithRdeSummary(result, summary, hints, RDE_SUMMARY_WIDGET_URI);
    },
  );

  server.registerTool(
    "kotonoha_agent_record_start",
    {
      title: "Start AgentRun",
      description: toolDescription(
        "Record AgentRun with status=started (requires DATABASE_URL).",
        "AgentRun を started で記録（DATABASE_URL 必須）。",
      ),
      inputSchema: z.object({
        agent_kind: z.string().optional().default("mcp"),
        external_ref: z.string().optional(),
        capability_profile: z
          .string()
          .optional()
          .default("kotonoha-agent"),
      }),
    },
    async ({ agent_kind, external_ref, capability_profile }) => {
      const args = [
        "agent",
        "record",
        "start",
        "--agent-kind",
        agent_kind ?? "mcp",
        "--capability-profile",
        capability_profile ?? "kotonoha-agent",
      ];
      if (external_ref) {
        args.push("--external-ref", external_ref);
      }
      const result = await runKotonoha({ args });
      if (result.exitCode === 0) {
        const runId = result.stdout.trim();
        return toolResultFromCli(result, { agent_run_id: runId });
      }
      if (result.exitCode === 1) {
        return toolResultFromCli(result, {
          hint_en: i18n.envErrorEn,
          hint_ja: i18n.envErrorJa,
        });
      }
      return toolResultFromCli(result);
    },
  );

  server.registerTool(
    "kotonoha_agent_record_complete",
    {
      title: "Complete AgentRun",
      description: toolDescription(
        "Set AgentRun status=completed.",
        "AgentRun を completed に更新。",
      ),
      inputSchema: z.object({
        run_id: uuid,
        output_artifacts_json: z
          .string()
          .optional()
          .describe("JSON array for output_artifact_refs"),
      }),
    },
    async ({ run_id, output_artifacts_json }) => {
      const args = ["agent", "record", "complete", "--run-id", run_id];
      if (output_artifacts_json?.trim()) {
        return toolResultFromCli(
          await withTempJsonFile(output_artifacts_json, (path) =>
            runKotonoha({
              args: [...args, "--output-artifacts", path],
            }),
          ),
        );
      }
      return toolResultFromCli(await runKotonoha({ args }));
    },
  );

  server.registerTool(
    "kotonoha_meaning_delta_from_run",
    {
      title: "Create MeaningDelta from AgentRun",
      description: toolDescription(
        "Create MeaningDelta linked to agent_run_id.",
        "agent_run_id 付きで MeaningDelta を作成。",
      ),
      inputSchema: z.object({
        file: z.string(),
        agent_run_id: uuid,
        line_start: z.number().int().optional(),
        line_end: z.number().int().optional(),
        diff_ref: z.string().optional(),
        observation_json: optionalObservationJson,
        repo_path: z.string().optional(),
      }),
    },
    async (input) => {
      const args = [
        "agent",
        "delta",
        "create",
        input.file,
        "--agent-run-id",
        input.agent_run_id,
      ];
      if (input.line_start !== undefined) {
        args.push("--line-start", String(input.line_start));
      }
      if (input.line_end !== undefined) {
        args.push("--line-end", String(input.line_end));
      }
      if (input.diff_ref) {
        args.push("--diff-ref", input.diff_ref);
      }
      if (input.observation_json?.trim()) {
        const result = await withTempJsonFile(input.observation_json, (obsPath) =>
          runKotonoha({
            args: [...args, "--observation", obsPath],
            cwd: input.repo_path,
          }),
        );
        if (result.exitCode === 0) {
          return toolResultFromCli(result, {
            meaning_delta_id: result.stdout.trim(),
          });
        }
        return toolResultFromCli(result);
      }
      const result = await runKotonoha({
        args,
        cwd: input.repo_path,
      });
      if (result.exitCode === 0) {
        return toolResultFromCli(result, {
          meaning_delta_id: result.stdout.trim(),
        });
      }
      return toolResultFromCli(result);
    },
  );

  server.registerTool(
    "kotonoha_rde_attach",
    {
      title: "Attach RDE to MeaningDelta",
      description: toolDescription(
        "Attach validated RDE JSON to MeaningDelta (source_kind=llm).",
        "検証済み RDE を MeaningDelta に attach（source_kind=llm）。",
      ),
      inputSchema: z.object({
        delta_id: uuid,
        rde_json: z.string(),
        strict: z.boolean().optional().default(true),
      }),
      _meta: {
        ui: { resourceUri: RDE_SUMMARY_WIDGET_URI },
        "openai/outputTemplate": RDE_SUMMARY_WIDGET_URI,
        "openai/toolInvocation/invoking": "Attaching RDE…",
        "openai/toolInvocation/invoked": "RDE attached",
      },
    },
    async ({ delta_id, rde_json, strict }) => {
      const args = [
        "rde",
        "attach",
        "--delta-id",
        delta_id,
        "--source-kind",
        "llm",
      ];
      if (strict) {
        args.push("--strict");
      }
      const result = await runKotonoha({ args, stdin: rde_json });
      const assessmentExtra =
        result.exitCode === 0
          ? { rde_assessment_id: result.stdout.trim() }
          : {};
      const validated = parseValidatedRdeSummary(rde_json);
      if (result.exitCode === 0 && validated) {
        return toolResultWithRdeSummary(
          result,
          validated,
          assessmentExtra,
          RDE_SUMMARY_WIDGET_URI,
        );
      }
      if (result.exitCode === 2) {
        const summary = buildValidationErrorSummary(result, {
          hint_en: i18n.validateFailedEn,
          hint_ja: i18n.validateFailedJa,
        });
        return toolResultWithRdeSummary(
          result,
          summary,
          { hint_en: i18n.validateFailedEn, hint_ja: i18n.validateFailedJa },
          RDE_SUMMARY_WIDGET_URI,
        );
      }
      return toolResultFromCli(result, assessmentExtra);
    },
  );

  // --- #135 / #136 Human Review Preparation + Approve UI ---

  server.registerTool(
    "kotonoha_copy_human_review_command",
    {
      title: "Copy human review CLI command",
      description: toolDescription(
        "Return a human-only `kotonoha review approve` command WITHOUT --agent-run-id. Does not execute review.",
        "人間用 `kotonoha review approve` コマンド文字列を返す（--agent-run-id なし・実行しない）。",
      ),
      inputSchema: z.object({
        delta_id: uuid,
        assessment_id: uuid.optional(),
        decided_by: z.string().optional().default("human"),
      }),
    },
    async ({ delta_id, assessment_id, decided_by }) => {
      const cmd = buildHumanReviewApproveCommand({
        deltaId: delta_id,
        assessmentId: assessment_id,
        decidedBy: decided_by,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                format: "kotonoha.human_review_command.v0.1",
                command: cmd,
                hint_en: i18n.copyCliHintEn,
                hint_ja: i18n.copyCliHintJa,
                forbidden: "--agent-run-id on review commands",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "kotonoha_prepare_human_review",
    {
      title: "Prepare human review package",
      description: toolDescription(
        "Export M2 review package, status summary, and human Approve/Hold/Reject UI (human path only).",
        "M2 export・ステータス・人間向け承認 UI 導線（人間操作のみ）。",
      ),
      inputSchema: z.object({
        delta_id: uuid,
        agent_run_id: uuid.optional(),
        assessment_id: uuid.optional(),
        agent_run_completed: z.boolean().optional().default(true),
        rde_validation_passed: z.boolean().optional().default(true),
      }),
      _meta: {
        ui: { resourceUri: HUMAN_REVIEW_WIDGET_URI },
        "openai/outputTemplate": HUMAN_REVIEW_WIDGET_URI,
        "openai/toolInvocation/invoking": "Preparing human review…",
        "openai/toolInvocation/invoked": "Human review ready",
      },
    },
    async (input) => prepareHumanReviewPackage(input),
  );
}
