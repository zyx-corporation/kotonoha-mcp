/**
 * Minimal validated RDE summary widget (#132) — ChatGPT Apps SDK resource.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { i18n, toolDescription } from "./i18n.js";

/** MCP Apps UI resource URI (static). */
export const RDE_SUMMARY_WIDGET_URI = "ui://kotonoha/rde-summary";

/** Human Approve / Hold / Reject widget (#136). */
export const HUMAN_REVIEW_WIDGET_URI = "ui://kotonoha/human-review";

const MCP_APP_HTML_MIME = "text/html;profile=mcp-app";

function loadWidgetHtml(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "web", "rde-summary-widget.html");
  return readFileSync(path, "utf8");
}

function loadHumanReviewWidgetHtml(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "web", "human-review-widget.html");
  return readFileSync(path, "utf8");
}

export function registerRdeSummaryWidget(server: McpServer): void {
  const html = loadWidgetHtml();

  server.registerResource(
    "rde-summary-widget",
    RDE_SUMMARY_WIDGET_URI,
    {
      title: "Validated RDE summary",
      description: toolDescription(
        "Renders validated RDE category counts or validation errors (not raw CLI logs).",
        "検証済み RDE のカテゴリ要約または検証エラーを表示（生ログは正本にしない）。",
      ),
      mimeType: MCP_APP_HTML_MIME,
    },
    async () => ({
      contents: [
        {
          uri: RDE_SUMMARY_WIDGET_URI,
          mimeType: MCP_APP_HTML_MIME,
          text: html,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
            "openai/widgetDescription": toolDescription(
              "Summary of validated RDE review output for human review preparation.",
              "人間レビュー準備のための検証済み RDE 要約。",
            ),
          },
        },
      ],
    }),
  );

  const humanHtml = loadHumanReviewWidgetHtml();
  server.registerResource(
    "human-review-widget",
    HUMAN_REVIEW_WIDGET_URI,
    {
      title: "Human review decisions",
      description: toolDescription(
        "Approve, Hold, or Reject as a human in the Agent channel (no autonomous agent approval).",
        "Agent チャネル上で人間が承認・保留・却下（自律エージェント承認ではない）。",
      ),
      mimeType: MCP_APP_HTML_MIME,
    },
    async () => ({
      contents: [
        {
          uri: HUMAN_REVIEW_WIDGET_URI,
          mimeType: MCP_APP_HTML_MIME,
          text: humanHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: { connectDomains: [], resourceDomains: [] },
            },
            "openai/widgetDescription": toolDescription(
              "Human Approve / Hold / Reject for Kotonoha semantic lineage.",
              "Kotonoha 人間レビュー（承認・保留・却下）。",
            ),
          },
        },
      ],
    }),
  );
}
