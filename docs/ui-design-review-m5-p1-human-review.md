# M5-P1 UI design review — Human Review Preparation

**Issue:** [management#135](https://github.com/zyx-corporation/kotonoha-management/issues/135) · parent [#128](https://github.com/zyx-corporation/kotonoha-management/issues/128)

**Normative:** [`04_mcp_tools_and_ux.md` §7](https://github.com/zyx-corporation/kotonoha-management/blob/main/docs/chatgpt-app/04_mcp_tools_and_ux.md) (Human Review Preparation UI)

**Implementation:** [`src/i18n.ts`](../src/i18n.ts) · [`src/human-review.ts`](../src/human-review.ts)

| Field | Value |
| --- | --- |
| **Date** | 2026-05-21 |
| **Judgment** | **Pass with notes** |

## D1 — Information design

| Result | Notes |
| --- | --- |
| **Pass** | Tool names distinguish preparation (`kotonoha_prepare_human_review`, `kotonoha_copy_human_review_command`) from execution tools. No `review_*` MCP tools. |

## D2 — Operation flow

| Result | Notes |
| --- | --- |
| **Pass** | Agent flow ends with `kotonoha_prepare_human_review` / copy CLI command; human uses M3 or CLI without `--agent-run-id`. |

## D3 — Accountability boundary

| Result | Notes |
| --- | --- |
| **Pass** | Banners in server instructions + tool descriptions. Forbidden `--agent-run-id` on review commands documented in package JSON. |

## D4 — Error experience

| Result | Notes |
| --- | --- |
| **Pass** | `hint_en` / `hint_ja` on validate fail, env error; capability deny templates in `i18n.ts`. |

## D5 — Wireframe alignment

| Result | Notes |
| --- | --- |
| **Pass with notes** | No ChatGPT widget wireframe; `Open in M3` deep link URI TBD (management #135 未解決要素). |

## #135 acceptance cross-check

| Criterion | Result |
| --- | --- |
| No `review.*` MCP tools | Pass |
| No Approve/Hold/Reject CTA in descriptors | Pass |
| Human approval pending in status summary | Pass |
| Copy CLI command without `--agent-run-id` | Pass |
| ja/en catalog | Pass — `src/i18n.ts` |
| D1–D5 | Pass with notes (this file) |

## Follow-up

- Widget rendering of `kotonoha.human_review_package.v0.1` (#132 optional)
- M3 deep link for `Open in M3` (vscode maintenance)
