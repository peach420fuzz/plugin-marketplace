# REMAKE by objekts — roadmap to 1.0 (live status, 2026-10-18)

**Owner:** objekts · **Product release:** PRIVATE 0.26.0 · **Public stateless MCP:** 0.2.0-beta (six tools) · **G5 OIDC staging:** 0.25.0-g5-staging, unpublished. **1.0 NOT READY.**

## Current gates

| Gate | Status | Evidence and next required proof |
|---|---|---|
| G1 creator inputs | PARTIAL | Accept 0/1/2/7/35/100 creative sources in skill; independent host intake with real attachments not measured |
| G2 media ground truth | PARTIAL | Local opt-in FFmpeg v0.26: 15/15 tests on synthetic audio/video; SHA256 source/frame, measured PTS, tamper detection; real video and AI-host visual observation NOT RUN |
| G3 director quality | NOT TESTED | 20 permissioned projects × 8+ turns × 2 blinded independent professional reviewers required; currently zero verified |
| G4 canonical revision engine | PARTIAL | Runtime state schema 0.23, stateless MCP six tools; 17/17 canonical + 9/9 legacy synthetic tests; no verified human approval/persistent storage |
| G5 OAuth user projects | BLOCKED | Staged fail-closed JWT verifier 18/18 synthetic, D1 owner/CAS 8/8; real identity provider absent; staging Workers subdomain disabled |
| G6 production-ready film | NOT TESTED | Real edit/shot/sound continuity and independent producer handoff review required |
| G7 distribution | NOT VERIFIED | Claude/Gemini GitHub source available, no official catalog receipts or independently installed end user |
| G8 trust & brand | BLOCKED | Approved original objekts v37 artwork not verified; check support/terms/privacy and legal/rights before release |
| G9 usefulness & leads | NOT MEASURED | Track real usefulness/returns and only explicit opt-in studio enquiries; private sources never forwarded by default |
| G10 official launch | NOT SUBMITTED | All P0 and critical QA must pass, then official OpenAI submission/approval and independent install |

## Changelog 0.26

- Deployed private REMAKE version 0.26.0: release `pluginrel_6ad5371c1624819180b4d83f08f89601`.
- Added [offline FFmpeg media integrity helper](scripts/remake_media_evidence_v026.py) and [15 unit tests](eval/test_remake_media_v026.py) with independent [G2 receipt](docs/REMAKE_G2_TEST_RECEIPT_v026.md).
- Source hash, per-frame PNG hashes and native PTS/stream evidence are measured; content interpretation, audio transcript, host seen status and licensing remain explicitly unverified.
- Current network sandbox could not retrieve real Wikimedia source; studio publicly indexed R2 video key was discovered but was not decoded. This is not a real-media pass.
- Updated canonical Library documents in place: `/OBJEKTS_28/REMAKE_V1_RELEASE_GATES_2026-10-18.md` and `REMAKE_V1_TECHNICAL_ACCEPTANCE_2026-10-18.md` (not public GitHub files).

## Product decisions and next iterations

**Provenance classes:** USER_DESCRIBED vs LOCAL_MEDIA_MEASURED vs HOST_OBSERVED_FRAME vs MODEL_HYPOTHESIS. Always preserve stable source ID, frame PTS and source/frame SHA, plus user approval state. Never promote ffprobe to proof the AI model saw or understood the shot.

**G2.1:** source a permissioned *actual non-synthetic* film, measure in local FFmpeg sandbox, verify per-frame PNG hashes and inspect frames inside the target model with source IDs and timecodes. No count restriction on project source assets; FFmpeg <=32 *samples per file* is a resource limit only.

**G2.2:** add actual host media bridge (host-native first, opt-in temporary upload only with deletion guarantees and privacy updates). No silent uploads or contact forwarding.

**G3:** run first independently reviewed 8-turn pilot and then 20 cases with two blind directing/editing reviewers. Zero fake approvals, invented visual facts/timecodes, unauthorized LOCK changes and silent sends.

**G5:** configure trusted real OIDC issuer/audience/JWKS and full OAuth host flow, then create/open/list/update/export/delete on two real independent owners; prove isolation, replay/CAS, token revocation and account deletion. Cloudflare Access being disabled does not preclude a different compliant OIDC provider, but no provider has yet been configured.

**G8→G7→G10:** verify canonical v37 brand asset, privacy/terms/support + rights, then real cross-host installs and only afterwards submit official catalog applications.

**No relabeling to 1.0 until real external acceptance receipts exist.** Keep negative test outcomes in roadmap.
