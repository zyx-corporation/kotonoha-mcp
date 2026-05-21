/**
 * Human-path review MCP tools (#136) — Approve / Hold / Reject without agent_run_id.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { humanReviewToolDescription } from "./i18n.js";
import { toolResultFromHumanReview } from "./review-human.js";
import { HUMAN_REVIEW_WIDGET_URI } from "./widget.js";

const uuid = z.string().uuid();

const reviewInputSchema = z.object({
  delta_id: uuid,
  assessment_id: uuid.optional(),
  decided_by: z
    .string()
    .optional()
    .default("human")
    .describe("Human reviewer identity (required for audit)"),
  rationale_json: z
    .string()
    .optional()
    .describe("Optional rationale JSON object string"),
});

const reviewToolMeta = {
  ui: { resourceUri: HUMAN_REVIEW_WIDGET_URI },
  "openai/outputTemplate": HUMAN_REVIEW_WIDGET_URI,
} as const;

export function registerHumanReviewTools(server: McpServer): void {
  server.registerTool(
    "kotonoha_review_approve",
    {
      title: "Record human approval",
      description: humanReviewToolDescription(
        "Record human approval for a MeaningDelta. Invoked by a person in the Agent channel — never with --agent-run-id.",
        "人間による承認を記録（Agent チャネル上の人間操作。--agent-run-id は付けない）。",
      ),
      inputSchema: reviewInputSchema,
      annotations: {
        destructiveHint: true,
        openWorldHint: false,
        readOnlyHint: false,
        idempotentHint: false,
      },
      _meta: {
        ...reviewToolMeta,
        "openai/toolInvocation/invoking": "Recording human approval…",
        "openai/toolInvocation/invoked": "Human approval recorded",
      },
    },
    async (input) =>
      toolResultFromHumanReview("approve", input, HUMAN_REVIEW_WIDGET_URI),
  );

  server.registerTool(
    "kotonoha_review_hold",
    {
      title: "Record human hold",
      description: humanReviewToolDescription(
        "Record human hold for further review. Human-in-channel only.",
        "人間による保留を記録（チャネル上の人間操作のみ）。",
      ),
      inputSchema: reviewInputSchema,
      annotations: {
        destructiveHint: false,
        openWorldHint: false,
        readOnlyHint: false,
        idempotentHint: false,
      },
      _meta: {
        ...reviewToolMeta,
        "openai/toolInvocation/invoking": "Recording human hold…",
        "openai/toolInvocation/invoked": "Human hold recorded",
      },
    },
    async (input) => toolResultFromHumanReview("hold", input, HUMAN_REVIEW_WIDGET_URI),
  );

  server.registerTool(
    "kotonoha_review_reject",
    {
      title: "Record human rejection",
      description: humanReviewToolDescription(
        "Record human rejection (send back for revision). Human-in-channel only.",
        "人間による却下を記録（修正依頼）。チャネル上の人間操作のみ。",
      ),
      inputSchema: reviewInputSchema,
      annotations: {
        destructiveHint: true,
        openWorldHint: false,
        readOnlyHint: false,
        idempotentHint: false,
      },
      _meta: {
        ...reviewToolMeta,
        "openai/toolInvocation/invoking": "Recording human rejection…",
        "openai/toolInvocation/invoked": "Human rejection recorded",
      },
    },
    async (input) =>
      toolResultFromHumanReview("reject", input, HUMAN_REVIEW_WIDGET_URI),
  );
}
