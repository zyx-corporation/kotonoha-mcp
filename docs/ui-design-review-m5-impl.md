# M5-P1 UI design review — RDE summary widget (implementation)

**Issue:** [management#132](https://github.com/zyx-corporation/kotonoha-management/issues/132) · parent [#128](https://github.com/zyx-corporation/kotonoha-management/issues/128)

**Normative:** [`04_mcp_tools_and_ux.md` §4](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md) · [`26` §4.1](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/26_rde_llm_connection_design_draft.md)

**Implementation:** [`web/rde-summary-widget.html`](../web/rde-summary-widget.html) · [`src/rde-summary.ts`](../src/rde-summary.ts) · [`src/widget.ts`](../src/widget.ts)

| Field | Value |
| --- | --- |
| **Date** | 2026-05-21 |
| **Judgment** | **Pass with notes** |

## D1 — Information design

| Result | Notes |
| --- | --- |
| **Pass** | Widget shows `spec_version`, `subject_ref`, and per-category counts from `kotonoha.rde_summary.v0.1` — not raw CLI stdout. |

## D2 — Operation flow

| Result | Notes |
| --- | --- |
| **Pass** | Linked to `kotonoha_rde_validate` and `kotonoha_rde_attach` via `_meta.ui.resourceUri` (`ui://kotonoha/rde-summary`). Agent flow unchanged; human review still via M3 / CLI. |

## D3 — Accountability boundary

| Result | Notes |
| --- | --- |
| **Pass** | Human-responsibility banner (§4.1 en/ja) always visible. No Approve/Hold/Reject controls in widget. |

## D4 — Error experience

| Result | Notes |
| --- | --- |
| **Pass** | Validation failures render `validation_error` state with §4.3 templates (`message_en` / `message_ja`, `exit_label`). |

## D5 — Wireframe alignment

| Result | Notes |
| --- | --- |
| **Pass with notes** | Minimal in-chat panel only; no pixel-perfect ChatGPT host wireframe. EN/JA toggle is widget-local (host locale API optional later). |

## #132 acceptance cross-check

| Criterion | Result |
| --- | --- |
| Validated payload or error only (no raw logs as canonical) | Pass — `structuredContent` + `rde_summary` |
| i18n §4 templates | Pass — banners + validate-fail messages |
| D1–D5 recorded | Pass with notes (this file) |

## Follow-up

- Host `window.openai.theme` styling polish
- Deep link `Open in M3` (vscode maintenance)
