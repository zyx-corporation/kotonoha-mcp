# kotonoha-mcp Expansion Boundary

## Status

**Informative — implementation mirror.** Canonical boundary document:

→ **[`kotonoha-spec` `docs/mcp-gateway-expansion-boundary.md`](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/mcp-gateway-expansion-boundary.md)**

If this summary disagrees with that document or normative `kotonoha-spec` text, **spec wins**.

## Tier

**Expansion integration layer** — not primary Kotonoha interface.

| Primary | Repository |
| --- | --- |
| Normative source | `kotonoha-spec` |
| First stable runtime | `kotonoha-cli` |
| First usable UI | `obsidian-kotonoha-console` |
| This repo | MCP tool bridge for external clients |

## Quick reference

### MAY

- Read-only context export, RDE validate/attach, sidecar lookup via CLI
- Stable CLI command delegation (1:1 tool → subcommand)
- Stable orchestrator adapter calls when explicitly documented per tool
- Human-reviewed handoff / review prep workflows

### MUST NOT

- Define Kotonoha semantics
- Silent approve / reject / apply
- Mutate notes without explicit user action
- Treat LLM output as accepted lineage
- Depend on `/v1/proposals/generate` as stable
- Bypass RDE / review sidecars
- Become primary interface
- Arbitrary shell — only [`src/kotonoha.ts`](src/kotonoha.ts)

## Expansion prerequisites

New tools require: spec-backed or explicitly experimental schema, stable CLI/adapter upstream, explicit identity, human-reviewed or read-only writes, auditable invocation. See canonical doc checklist.

## Related

| Document | Role |
| --- | --- |
| [mcp-gateway-expansion-boundary.md (spec)](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/mcp-gateway-expansion-boundary.md) | Canonical boundary |
| [mcp-server-contract.md](mcp-server-contract.md) | Human review path, CLI-only spawn |
| [README.md](../README.md) | Tool catalog |

Governance: [kotonoha-management #166](https://github.com/zyx-corporation/kotonoha-management/issues/166)
