# REMAKE by objekts — roadmap to 1.0 (live status, 2026-10-18)

**Owner:** objekts · **Product release:** PRIVATE 0.27.0 · **Public stateless MCP:** 0.2.0-beta (six tools) · **G5 OIDC staging:** 0.25.0-g5-staging, unpublished. **1.0 NOT READY.**

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


## Cycle 0.27 — genuine source-video evidence, private workspace only

- Two existing **real, locally materialized video files** from the owner's permitted Library were processed without transmitting content to GitHub or the public MCP. Source A: 7.042 s/169 decoded frames (H.264); source B: 4.042 s/97 decoded frames (HEVC); 1920×1080/24fps; both no audio tracks. **8+6 native PTS sampled PNG frames** extracted, source and frame hashes verified.
- The assistant actually viewed those 14 sampled frame images through the current conversation's internal image viewer, and produced five frame-specific descriptive observations and one explicitly **PROPOSED** directing hypothesis. This is not execution *inside the installed REMAKE plugin*, not inspection of the full video, and not independent semantic/human evaluation.
- The new local tool `scripts/remake_visual_claims_v027.py` validates source ID, source SHA256, frame index, PTS, PNG SHA256, review-surface declarations and approval boundaries; it expressly **cannot** cryptographically verify what a frame shows or who visually inspected it.
- **18/18 reproducible generic test fixtures** plus **15/15 real source-bound tests** passed; the 0.26 FFmpeg synthetic regression suite passes **15/15**. Only the generic tests and code are public; client bytes/frames and brand descriptions remain in the owner's private workspace.
- **G2.1 = PASS in narrow local scope; overall G2 = PARTIAL**, as an actual host plugin media ingestion pipeline is still absent. **G3 remains NOT TESTED**, external experts have not performed blind multi-turn ratings. G5 OAuth, G8 brand, G10 store submission are still blocked.
- This is a functional private plugin release update `0.27.0`, not a public product launch.

**Roadmap improvement: verified-source observation contract.** For every visual factual statement, record source ID, SHA256, frame index, true PTS, sample PNG SHA256 and the actual surface by which the host saw the sample; force separate hypothesis/approval states. Treat declarations as non-authenticating; semantic truth and third-party rights must be verified independently. Pilot paper cuts may be produced only from permitted media and never marked creator approved.

**Next:** G2.2 host-native frame processing (not just a standalone local script), G3 ≥8-turn external reviewer pilot, and OAuth G5 real-identity integration. No official-directory submission until P0 acceptance.
