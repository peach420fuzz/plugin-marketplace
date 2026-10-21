# REMAKE by objekts — current beta source

Current candidate: **0.35.1**. Public MCP candidate: **0.7.2-beta**, nine stateless tools. Existing private release remains0.35.0 until a guarded save and readback verifies its update. No official directory listing or1.0 release is asserted.

REMAKE turns creator-provided ideas, scripts and inspectable media into actionable shot, blocking, edit and sound proposals. No fixed source count. Native host perception is separate from server metadata checks. Public drafts are caller-owned JSON, not authenticated project storage.

Version0.35.1 fixes a reproduced portable-export defect: a shot could contradict a static-camera LOCK, contradictory repeated keys could conceal a lock, and duplicate shot IDs could enter a packet. The compiler now rejects these exact structural conflicts. Review examples use supported draft operations and actual returned fields.

Runtime tests and package validation do not prove professional directing quality. Real host recordings, independent author sessions, G5 identity and official review remain separate requirements. Source and evidence are in [the living roadmap](ROADMAP_V1_LIVE.md).

## Historical source notes — preserved verbatim

The following entries describe earlier releases. Their version/status statements are historical and are superseded by the current ledger above.

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

## Private REMAKE 0.27 — grounded source/frame observation association

The latest private plugin adds [frame-claim association tooling](scripts/remake_visual_claims_v027.py), [18 public synthetic tests](eval/test_visual_claims_v027.py), and a [guide](docs/REMAKE_VISUAL_CLAIMS_v027.md). The local test used two real video sources in the owner's Library: 14 sampled PNGs with real PTS and hashes, five direct frame observations, and one separately labelled directing hypothesis. Actual confidential media or its stills were **not** committed here. Public MCP remains descriptor/state-only and does **not** execute these media tools. See the [living roadmap](ROADMAP_V1_LIVE.md) for unfinished G2/G3/G5/brand/catalog gates.


## Private REMAKE 0.28 — opt-in ChatGPT file attachment preflight

Public MCP worker `0.3.0-beta` exposes seven tools, including [`remake_host_file_preflight`](host-file-v028.mjs). It uses OpenAI's official `openai/fileParams` file schema and performs bounded transient SHA256 / PNG-JPEG-WebP-MP4 signature checks. It does **not** automatically decode video, inspect image semantics, keep user files or forward content to the studio. The [public privacy notice](https://remake.objekts.ai/privacy) discloses this optional transfer.

Tests: **14/14** hosted fileParam simulation, **17/17** canonical engine and **9/9** prior tools; all synthetic, not verified real ChatGPT attachment calls. Current private plugin release `0.28.0` has updated instructions. Cross-platform file adapter support and host media perception remain unverified. See the [live release gate list](ROADMAP_V1_LIVE.md).

**Important:** `remake_host_file_preflight` uses a ChatGPT-specific file reference format; Claude/Gemini/Alice adapters do not automatically gain that ability from this code. The general REMAKE workflow remains source-count agnostic.


## REMAKE 0.29 — source-bound image content and G3 preflight

Private REMAKE **0.29.0** and public MCP **0.4.0-beta** now implement an eighth tool, [`remake_host_image_for_review`](image-review-v029.mjs). It returns a permitted PNG/JPEG as an actual MCP `type:image` block with `source_id`, SHA256 and dimensions. The assistant must truly inspect returned pixels before claiming visual facts; returning the block is **not** proof the host model saw it. Max 2MiB per inline image, no storage/hidden marketing handoff. **54/54 synthetic** live server tests passed, but no installed-host real fileParam call verified. The [privacy notice](https://remake.objekts.ai/privacy) explicitly distinguishes metadata preflight from image pixel transfer.

The private G3 offline 8-turn transcript consistency harness passed 14/14 tests, including 20 × 8-turn **authored synthetic** sessions. It does not measure real creative output or the authenticity of user confirmation receipts; 20 actual independent sessions with two blinded reviewers remain undone. All critical 1.0 gates are tracked in the [living roadmap](ROADMAP_V1_LIVE.md).


## Private REMAKE 0.30 — media-integrity correction and CI

The current private plugin is **0.30.0**, public stateless MCP **0.5.0-beta** with eight tools. A prior test image contained a **bad PNG IDAT CRC** and exposed a genuine gap: header checking was insufficient. The tool now rejects bad PNG chunk CRC, damaged IHDR, truncation, trailing data, and malformed JPEG marker envelopes before sending the image to the host. Code: [image-integrity-v030.mjs](image-integrity-v030.mjs). Full pixel decoding and proof the AI host viewed an image are **not** implemented by these checks.

The previously publicly callable stress-test URLs are now protected: without a server diagnostic key they return 404. [GitHub Actions (PASS)](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39213968454) checks real JSON-RPC dispatch and **59/59 synthetic helper cases** inside CI, with 13/13 integration assertions. This is **not** proof of successful installed ChatGPT fileParams execution or independent directing quality. The [living release roadmap](ROADMAP_V1_LIVE.md) tracks these remaining gates explicitly.


## REMAKE 0.31 — native ChatGPT array fileParams

Private plugin **0.31.0**, public stateless MCP **0.6.0-beta (nine tools)**. Source: [image-batch-v031.mjs](image-batch-v031.mjs), tests in [MCP dispatcher](tests/mcp-integration-v030.mjs). ChatGPT supports `_meta["openai/fileParams"]` top-level arrays; `remake_host_image_batch` maps each user-selected file to stable source IDs, SHA256, and separate image content for host inspection. Per-call transport is limited to 8 PNG/JPEG images and 8 MiB aggregate, but there is **no creative source-count limit**; invoke in more batches for a large project. No mandatory screenplay.

**CI [PASS](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39240250059)** covers 2- and 7-file JSON-RPC calls and 16/16 new synthetic cases (75/75 combined helper tests). No installed-host real image attachment or independent model perception evidence; G2.2 remains PARTIAL, not passed. Separate original icon resources were located on the official studio domain (`objekts-icon-v37.png`, `apple-touch-icon-v37.png`), but have not been copied or owner-approved for this plugin. See [roadmap](ROADMAP_V1_LIVE.md).


## REMAKE 0.33: unauthenticated public revisions are draft-only

A verified G4 privilege flaw in the old public MCP let anyone spoof `actor_claim=USER` and `approval_ref`. Public tool `remake_project_apply_delta` now denies `lock_set`, `lock_remove`, decision approval/rejection, forged image OBSERVED states, and edits to rejected or approved shots. Allowed draft edits remain usable. Source: [public-delta-guard-v033.mjs](public-delta-guard-v033.mjs). [GitHub CI PASS](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39249304466) includes **20 direct synthetic JSON-RPC security tests**. No proof of actual human approval or user authentication; do not confuse the public schema with secure persistent user state.

Installed private REMAKE 0.33.0; public Worker 0.7.0-beta (nine tools). G2 real ChatGPT attachment, G3 independent director quality, G5 real OAuth and official app publication all remain unverified. See [roadmap](ROADMAP_V1_LIVE.md).


## REMAKE 0.34 — director-first experience (private beta)

The owner tried the previous plugin and reported unsatisfactory creative quality. Current private version **0.34.0** changes the MAIN instruction to prioritize a useful film-directing action and not overwhelm the user with internal 0.21–0.33 release notes. Active skill shrank **23,709 → 8,259 bytes**; history is retained in a reference. Local 97/97 Python utility tests PASS; **no independent improvement in actual model artistic performance was proven**. Public nine-tool MCP Worker remains 0.7-beta. Claude/Gemini/xAI/GitHub Skill files synced as developer source, not official app-store distributions. See [living roadmap](ROADMAP_V1_LIVE.md).
