/**
 * Human Review Preparation — no review.* MCP tools (#135).
 */

import { i18n } from "./i18n.js";
import { runKotonoha, toolResultFromCli, type ToolResultPayload } from "./kotonoha.js";

export function buildHumanReviewApproveCommand(opts: {
  deltaId: string;
  assessmentId?: string;
  decidedBy?: string;
}): string {
  const parts = [
    "kotonoha",
    "review",
    "approve",
    "--delta-id",
    opts.deltaId,
  ];
  if (opts.assessmentId) {
    parts.push("--assessment-id", opts.assessmentId);
  }
  parts.push("--decided-by", opts.decidedBy ?? "human");
  return parts.join(" ");
}

export function buildStatusSummary(flags: {
  agentRunCompleted?: boolean;
  rdeValidationPassed?: boolean;
  meaningDeltaCreated?: boolean;
  rdeAttached?: boolean;
}): { en: string[]; ja: string[] } {
  const en: string[] = [];
  const ja: string[] = [];
  if (flags.agentRunCompleted) {
    en.push(i18n.statusAgentRunCompletedEn);
    ja.push(i18n.statusAgentRunCompletedJa);
  }
  if (flags.rdeValidationPassed) {
    en.push(i18n.statusRdeValidationPassedEn);
    ja.push(i18n.statusRdeValidationPassedJa);
  }
  if (flags.meaningDeltaCreated) {
    en.push(i18n.statusMeaningDeltaCreatedEn);
    ja.push(i18n.statusMeaningDeltaCreatedJa);
  }
  if (flags.rdeAttached) {
    en.push(i18n.statusRdeAttachedEn);
    ja.push(i18n.statusRdeAttachedJa);
  }
  en.push(i18n.statusHumanApprovalPendingEn);
  ja.push(i18n.statusHumanApprovalPendingJa);
  return { en, ja };
}

export async function prepareHumanReviewPackage(input: {
  delta_id: string;
  agent_run_id?: string;
  assessment_id?: string;
  rde_validation_passed?: boolean;
  agent_run_completed?: boolean;
}): Promise<ToolResultPayload> {
  const exportResult = await runKotonoha({
    args: ["export", "--delta-id", input.delta_id, "--format", "m2"],
  });

  if (exportResult.exitCode !== 0) {
    return toolResultFromCli(exportResult, {
      hint_en: i18n.envErrorEn,
      hint_ja: i18n.envErrorJa,
    });
  }

  let exportJson: unknown;
  try {
    exportJson = JSON.parse(exportResult.stdout);
  } catch {
    exportJson = { raw: exportResult.stdout };
  }

  const cliCommand = buildHumanReviewApproveCommand({
    deltaId: input.delta_id,
    assessmentId: input.assessment_id,
    decidedBy: "human",
  });

  const status = buildStatusSummary({
    agentRunCompleted: input.agent_run_completed ?? true,
    rdeValidationPassed: input.rde_validation_passed ?? true,
    meaningDeltaCreated: true,
    rdeAttached: input.assessment_id !== undefined,
  });

  const packagePayload = {
    format: "kotonoha.human_review_package.v0.1",
    agent_run_id: input.agent_run_id ?? null,
    meaning_delta_id: input.delta_id,
    rde_assessment_id: input.assessment_id ?? null,
    status_summary_en: status.en,
    status_summary_ja: status.ja,
    human_responsibility_banner_en: `${i18n.agentPrepareEn} ${i18n.humanBannerEn}`,
    human_responsibility_banner_ja: `${i18n.agentPrepareJa} ${i18n.humanBannerJa}`,
    next_actions: {
      open_human_review_en: i18n.openHumanReviewEn,
      open_human_review_ja: i18n.openHumanReviewJa,
      copy_cli_review_command: cliCommand,
      copy_cli_hint_en: i18n.copyCliHintEn,
      copy_cli_hint_ja: i18n.copyCliHintJa,
      forbidden_example:
        "kotonoha review approve --delta-id ... --agent-run-id ... (DENIED)",
    },
    m2_export: exportJson,
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(packagePayload, null, 2),
      },
    ],
  };
}
