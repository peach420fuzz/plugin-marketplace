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

## G5 OAuth/OIDC staging (0.25.0, *not* available to public users)

An **experimental fail-closed authenticated account backend** is deployed as the separate Worker `objekts-remake-g5-staging`, using the existing internal REMAKE D1 database. Its implementation is in [account-gateway-v025.mjs](account-gateway-v025.mjs) and [oidc-resource-v025.mjs](oidc-resource-v025.mjs).

- Requires a valid resource-audience access token from a configured trusted OIDC issuer and JWKS. Validates RS256 signature, `iss`, `aud`, `sub`, expiry, time and scopes. Tokens cannot carry arbitrary issuer/JWKS URLs.
- D1 CRUD/CAS is keyed by a hash of the verified issuer and subject, and independent create, list, open, export, draft-update and delete methods are defined. Approval/lock editing is disabled until a trusted user confirmation path exists.
- In the current deployment **no real OIDC provider is configured**, so account access and writing are **disabled**. Cloudflare Access in this account returns `access.api.error.not_enabled`.
- 18/18 ephemeral WebCrypto-signed synthetic JWT/policy tests passed on Cloudflare Worker, but no real provider integration or live user login succeeded. Prior D1 owner/CAS tests: 8/8 synthetic, fixture rows deleted.
- The staging Worker has **workers.dev publishing disabled** after tests. This is not a public auth endpoint or evidence of a connected ChatGPT/Claude account. Private plugin version stays 0.24, public stateless MCP stays 0.2-beta.

G5 acceptance remains **BLOCKED** on verified provider configuration, actual MCP OAuth resource metadata/authorization with a permitted client, cross-user isolation integration tests, explicit UI consent for approvals and revocation/session/delete audits. Do not mark REMAKE as 1.0 or submit the official plugin yet.

## Current engineering status — 18 October 2026

Private REMAKE ChatGPT plugin is now **0.26.0**. It adds [opt-in local video evidence processing](scripts/remake_media_evidence_v026.py): actual PTS, video/audio stream facts, source SHA256, sampled PNG SHA256 and tamper verification. 15/15 FFmpeg tests were run on **synthetic** clips; real video/host AI perception remains untested. **Do not describe this as a ready image/video-understanding product.**

The [live roadmap to v1](ROADMAP_V1_LIVE.md) tracks all G1–G10 gates with explicit blocked status and next proof. This version remains **private** and not a public OpenAI directory listing. Protected G5 account gateway is disabled pending configured OAuth/OIDC. No independent blind directorial evaluations have passed.
