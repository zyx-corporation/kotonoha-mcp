# M5-P1c UI design review — Agent Approve UI

**Issue:** [management#136](https://github.com/zyx-corporation/kotonoha-management/issues/136)

**Normative:** [`05_agent_approve_ui_draft.md`](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/05_agent_approve_ui_draft.md)

**Implementation:** [`web/human-review-widget.html`](../web/human-review-widget.html) · [`src/register-review-tools.ts`](../src/register-review-tools.ts)

| Field | Value |
| --- | --- |
| **Date** | 2026-05-21 |
| **Judgment** | **Pass with notes** |

## D1 — Information design

| Result | Notes |
| --- | --- |
| **Pass** | `kotonoha_review_{approve,hold,reject}` vs preparation tools; widget shows MeaningDelta / Assessment IDs. |

## D2 — Operation flow

| Result | Notes |
| --- | --- |
| **Pass** | prepare → widget CTA → MCP review tool → CLI without `--agent-run-id`. E2E: `m5_mcp_e2e.ts` step 8. |

## D3 — Accountability boundary

| Result | Notes |
| --- | --- |
| **Pass** | Confirm dialog + §4.1 banners; `KOTONOHA_AGENT_RUN_ID` cleared on CLI spawn; schema has no `agent_run_id`. |

## D4 — Error experience

| Result | Notes |
| --- | --- |
| **Pass** | `human_review_result` + exit labels; autonomous deny hints if env leaks agent context. |

## D5 — Wireframe alignment

| Result | Notes |
| --- | --- |
| **Pass with notes** | Minimal HTML; host `callTool` required for in-widget buttons. |

## #136 acceptance

| Criterion | Result |
| --- | --- |
| Human Approve in Agent channel | Pass — widget + MCP |
| No `--agent-run-id` on MCP review tools | Pass — schema + env unset |
| Deny regression | Pass — step 7 unchanged |
| D1–D5 | Pass with notes (this file) |
