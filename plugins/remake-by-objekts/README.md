# REMAKE by objekts — source and engineering beta

REMAKE is a film-direction workshop by [objekts](https://objekts.ai/). It accepts any available combination of idea, text, script, images, video, audio and storyboards, without a predetermined source count.

**Not 1.0.** Public MCP runtime **0.2.0-beta**, private OpenAI skill **0.24.0**. The MCP is stateless and does not provide cross-chat accounts, persistent memory, real audiovisual perception, or proof of a human author's approval.

## Live MCP endpoint

`https://remake.objekts.ai/mcp`

Tools:
1. `inventory_creative_materials` — descriptor registry, not pixel inspection.
2. `check_explicit_project_locks` — exact keyed project-lock comparisons.
3. `compile_portable_director_packet` — stateless portable brief from caller data.
4. `remake_project_create` — canonical `remake.project/0.23` packet.
5. `remake_project_validate` — material/shot/decision references and constraints.
6. `remake_project_apply_delta` — pure revision event, optimistic CAS and event-idempotency. **Caller must save the returned packet.** An `actor_claim=USER` field does not prove authenticated human approval.

Source: [core-v024.mjs](core-v024.mjs), [worker.mjs](worker.mjs).

## Reproducible live checks

- `https://remake.objekts.ai/_core_selftest` — 17/17 synthetic cases, including Python/JS SHA256 parity with UTF-8 Cyrillic and English.
- `https://remake.objekts.ai/_selftest` — 9/9 previous descriptor-only cases.
- `https://remake.objekts.ai/health` — `storage=false`, `inference=false`.
- Separate private D1 staging SQL test: 8/8 row-owner/CAS/cleanup checks. This **does not** certify OAuth or real host user isolation.

## v1.0 critical gates

Real independent 20 × 8-turn creative sessions with blinded reviewer assessments; per-user verified OAuth/OIDC and cross-session persistence; permissioned media perception in actual host; verified LOCK retention throughout longer conversations; authorized media/brief handoff; independent user install in supported platform catalogs; publisher brand assets and security review.

Distribution sources for Claude/Gemini/other platforms in this repository are beta developer packages, not receipts of catalog approval.

Privacy: https://remake.objekts.ai/privacy

Support: salute@objekts.ai
