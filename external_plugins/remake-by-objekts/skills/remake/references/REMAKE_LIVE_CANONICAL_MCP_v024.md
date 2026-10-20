# REMAKE 0.24 — live canonical MCP (G4 partial)

## Tools and source of truth

- `remake_project_create({project_id,title?,author_intent?})` returns a fresh `remake.project/0.23` `project`, not a persisted account.
- `remake_project_validate({project})` rejects unknown material refs, duplicate sources, contradicting LOCKs, fake inspection claims and unsupported statuses in the supplied packet. `host_inspected=true` remains only a **claim from the invoking host**, not pixel-level proof.
- `remake_project_apply_delta({project,event})` returns **a new project**, with `expected_revision` CAS and hashed event-idempotency. Supported event kinds: `material_add`, `shot_add`, `shot_field_set`, `lock_set`, `lock_remove`, `decision_propose`, `decision_approve`, `decision_reject`. Explicit user confirmation fields are not authenticated by this endpoint.

All data is stateless. No user account, persistent session, project list, real media upload, cross-chat memory, studio delivery, human review, or verified owner identity. Save/export updated JSON outside the MCP between calls. AI host can visually inspect only media actually passed to it; the MCP cannot inspect pixels or listen to audio.

## Observable engineering receipt

Verified 2026-10-18 through Cloudflare API deployment and independent external GET to:
- `https://remake.objekts.ai/_core_selftest`: 15/15 passed (pure synthetic test cases)
- `https://remake.objekts.ai/_selftest`: 9/9 passed (previous descriptor-only regression cases)
- `https://remake.objekts.ai/health`: `0.2.0-beta`, `storage=false`, `inference=false`

Source: https://github.com/peach420fuzz/plugin-marketplace/blob/main/plugins/remake-by-objekts/core-v024.mjs

## Critical next engineering tasks (blocked)

G4 is *partially* operational via MCP, but G5 (secure cross-session state) is not. Use actual OAuth/OIDC and per-owner isolation before exposing writeable persistent projects to outside users. Independently assess film-direction quality across 20 cases × >=8 turns and 2 blinded reviewers before v1.0. Evaluate actual media in host; never convert synthetic unit tests into claims of director quality.
