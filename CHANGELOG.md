# Changelog

## [0.3.0] — 2026-05-21

### Added

- **#132:** Minimal RDE summary widget — `web/rde-summary-widget.html`, `ui://kotonoha/rde-summary` resource, `kotonoha.rde_summary.v0.1` structured output on validate/attach.
- `src/rde-summary.ts`, `npm run test:unit`, [`docs/ui-design-review-m5-impl.md`](docs/ui-design-review-m5-impl.md).

## [0.2.2] — 2026-05-21

### Added

- **#134:** `scripts/contract-cli-only.sh`, `docs/mcp-server-contract.md`, `npm run contract:cli-only` (CI gate).

## [0.2.1] — 2026-05-21

### Added

- **#131:** `scripts/m5_mcp_e2e.ts` + `m5_mcp_e2e.sh` — MCP stdio client E2E (§6.1 + §4.5 exit 2 probe).
- `npm run test:e2e`; GitHub Actions [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml).

## [0.2.0] — 2026-05-21

### Added

- **#130:** MCP tools — `kotonoha_context_export`, `kotonoha_rde_validate`, `kotonoha_agent_record_*`, `kotonoha_meaning_delta_from_run`, `kotonoha_rde_attach`.
- **#135:** Human Review Preparation — `kotonoha_prepare_human_review`, `kotonoha_copy_human_review_command`; `src/i18n.ts`; no `review.*` tools.
- Bilingual tool descriptions; stdin JSON for RDE validate/attach.

## [0.1.0] — 2026-05-21

### Added

- **#129:** MCP stdio scaffold, `kotonoha_ping`, CLI subprocess (`KOTONOHA_BIN`, `KOTONOHA_WORKDIR`, `DATABASE_URL`).
