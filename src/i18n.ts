/**
 * Agent-channel message catalog (ja / en) — #135 Human Review Preparation UI.
 */

export const i18n = {
  humanBannerEn:
    "RDE assessments support review; they do not replace human judgment.",
  humanBannerJa:
    "RDE はレビューを支援します。最終判断の代替ではありません（人間責任）。",
  agentPrepareEn: "Agent prepares. Human decides. Kotonoha records both.",
  agentPrepareJa:
    "エージェントは準備する。人間が判断する。Kotonoha はその両方を記録する.",
  statusAgentRunCompletedEn: "AgentRun completed",
  statusAgentRunCompletedJa: "AgentRun 完了",
  statusRdeValidationPassedEn: "RDE validation passed",
  statusRdeValidationPassedJa: "RDE 検証通過",
  statusMeaningDeltaCreatedEn: "MeaningDelta created",
  statusMeaningDeltaCreatedJa: "MeaningDelta 作成済み",
  statusRdeAttachedEn: "RDE attached",
  statusRdeAttachedJa: "RDE 添付済み",
  statusHumanApprovalPendingEn: "Human approval pending",
  statusHumanApprovalPendingJa: "人間承認待ち",
  validateFailedEn: "RDE validation failed. Fix the draft before attach.",
  validateFailedJa: "RDE 検証に失敗しました。attach 前に草案を修正してください。",
  capabilityDenyEn:
    "This action is reserved for human review. Open M3 or copy the CLI command.",
  capabilityDenyJa:
    "この操作は人間レビュー専用です。M3 を開くか、CLI コマンドをコピーしてください。",
  envErrorEn:
    "Configure DATABASE_URL or gateway settings before recording AgentRun.",
  envErrorJa:
    "AgentRun を記録する前に DATABASE_URL または gateway 設定を行ってください。",
  copyCliHintEn: "Copy CLI Review Command (human only; no --agent-run-id):",
  copyCliHintJa: "人間用 CLI コマンドをコピー（--agent-run-id なし）:",
  openHumanReviewEn: "Open Human Review — use M3 or the CLI command below.",
  openHumanReviewJa: "人間レビューへ — M3 または下記 CLI コマンドを使用してください。",
} as const;

/** Bilingual MCP tool description (en + ja + responsibility banner). */
export function toolDescription(en: string, ja: string): string {
  return [
    en,
    "",
    `（日本語）${ja}`,
    "",
    i18n.humanBannerEn,
    i18n.humanBannerJa,
    i18n.agentPrepareEn,
    i18n.agentPrepareJa,
  ].join("\n");
}
