# REMAKE by objekts — roadmap to 1.0 (live status, 2026-10-18)

**Owner:** objekts · **Product release:** PRIVATE 0.35.0 · **Public stateless MCP:** 0.7.1-beta (nine tools) · **G5 OIDC staging:** 0.25.0-g5-staging, unpublished. **1.0 NOT READY.**

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


## Cycle 0.28 — G2.2a host fileParams bridge (public MCP, private plugin)

- Public REMAKE MCP `0.3.0-beta` now includes seventh tool, `remake_host_file_preflight`, using ChatGPT's documented `_meta["openai/fileParams"] = ["file"]`. Requires host-provided `file.download_url` and `file.file_id`, with optional declared `mime_type` / `file_name`. This is a per-file call and imposes **no fixed number of references per creative project**.
- The backend permits only HTTPS `*.oaiusercontent.com` URLs without redirects, streams up to 12MiB, verifies PNG/JPEG/WebP/MP4 signature, computes SHA256 and dimensions when possible, without persisting user bytes or sending anything to objekts. Privacy notice updated to disclose temporary processing. Actual audio/timecodes/film meaning are **not** returned; media evidence says `model_saw_pixels:false` and `visual_semantics:NOT_ANALYZED`.
- External live smoke tests: `/_file_selftest` **14/14**, `/_core_selftest` **17/17**, `/_selftest` **9/9** = **40/40 SYNTHETIC** Cloudflare tests. These used a stubbed host file URL and synthetic 1×1 PNG; **no actual fileParam object from ChatGPT has reached the server in a verified test**.
- Private plugin **0.28.0** installed (same ID), verified release `pluginrel_6ad541ca3eb08191b9256d73eae2faa6`. New skill and `REMAKE_HOST_FILE_BRIDGE_v028.md` explicitly separate binary preflight from model vision and user authorization. G2.2 is **PARTIAL**; no submission/official installation/independent directing tests claimed.
- Official OpenAI `fileParams` reference: https://developers.openai.com/plugins/reference . Public reports have documented missing or partial mobile / other fileParam bindings (GitHub `openai-apps-sdk-examples` issues #185/#237); treat this as a required reliability test, not assumed failure or guaranteed success.
- Security limitations: allowlisted signed URL is not proof the calling actor is the authenticated owner; an authorized plugin file handoff still needs host/user consent. Model descriptions are not evidence that the server received bytes. A file's SHA only proves byte identity, not its semantics or cinematography.

**Roadmap refinement — split G2.2 into separately gated layers:**
1. **G2.2a transport**: real host `fileParams` attachment forwarded into the REMAKE server; SHA256 independently agrees with original; test mobile+desktop, lost parameters, unsupported formats and expiry; no raw storage.
2. **G2.2b perception**: the model actually receives selected, source-bound frames as visual inputs, sees accurate PTS for video, differentiates OBSERVED from PROPOSED, and refrains from hallucinating uninspected content. The metadata-only `remake_host_file_preflight` does not satisfy this.
3. **G3 qualitative directing**: 20 permissioned projects × ≥8 real turns with two blinded human directors/editors and zero critical LOCK/approval/source hallucinations.

**Remaining blockers:** G5 OAuth is unconfigured, G8 approved v37 asset absent, G7 official host integration/independent distribution not verified, G10 public application not submitted. Continue toward 1.0 by real host file handoff + vision pipeline and then independent G3 pilot. Do not relabel the product until P0 passes.

## Cycle 0.29 — source-bound pixels via MCP ImageContent (19 Oct 2026)

- The public Worker `0.4.0-beta` includes the **eighth tool**, `remake_host_image_for_review`. It accepts a selected ChatGPT fileParam image (PNG/JPEG), fetches it from an authorized temporary URL, computes SHA256 and returns proper **MCP ImageContent** with actual base64 pixels and separately structured provenance. Earlier `remake_host_file_preflight` only returned hashes/signatures. Inline image transfer is limited to **2 MiB/image**, header image dimensions ≤4096×4096, and does not support MP4 frame extraction. Limits apply to each file/tool call, not the number of creative source items.
- **54/54 SYNTHETIC live Cloudflare tests PASS:** 14 image-bridge + 14 file-preflight + 17 canonical project + 9 legacy. The image test used synthetic 1×1 PNG and fake/stubbed host URL; it did not test an actual installed ChatGPT plugin file selection or visual model consumption.
- The host-facing result correctly declares `host_model_observation:UNVERIFIED_UNTIL_CALLING_MODEL_ACTUALLY_INSPECTS_IMAGE`. The server cannot certify a model saw the pixels, and SHA256 is not semantic correctness. No original images are logged in GitHub or forwarded to objekts. Privacy notice updated for host-side pixel processing/retention.
- The same existing private REMAKE plugin updated **0.29.0** (release `pluginrel_6ad5462d80f08191bfb44cac783b99b7`). Its updated skill prevents falsely marking tool output as observed visual truth; no new public store listing was submitted.
- **G2.2b transport implemented with synthetic runtime checks; overall G2 remains PARTIAL and host end-to-end acceptance BLOCKED**. G3 independent 8-turn director quality sessions remains **0 verified**, G5 OAuth provider still absent, G8 verified publisher asset still missing, G10 official submission absent.

### Further improvement to roadmap

Split evidence into **received media bytes**, **returned model-facing image block**, **observed image in model runtime**, and **independently semantically verified claim**. Treat each as a different gate with its own receipt; never promote a successful upload, hash, image block, or selftest directly into a director-quality PASS.

Next measurable execution: authorized actual fileParam from a live host; independent SHA matching; proof the resulting ImageContent was received and inspected; 1/2/7 image tests and failure/expiry cases; for video, actual FFmpeg native PTS sample extraction; then professional blind eight-turn evaluation. No 1.0 until those proofs.


## Cycle 0.29b — G3 eight-turn consistency preflight (19 Oct 2026)

- Added local standalone `transcript_guard_v029.py` (not deployed into the public MCP). It audits a multi-turn structured directing trace for lock collisions, approved-shot mutation, fake model approval, unverified sending, repeated rejected proposals, missing source/PTS/host observation evidence, and duplicate action IDs.
- **14/14 local unittest methods PASS**, including one that simulates **20 × 8-turn authored synthetic sessions**. This cannot qualify as 20 real creator sessions, cannot authenticate any claimed human approvals and cannot judge cinema, blocking, sound, edit or emotional effect.
- G3 actual creative acceptance remains **NOT RUN**: 20 permissioned real projects with ≥8 real interaction turns each, two independent professional directors/editors reviewing blind, explicit quality scores and zero critical hallucinations/LOCK mutations.
- Pilot next: run one authentic 8-turn user session using an actual verified attachment, capture source-bound visual observations and author feedback with privacy permission, apply guard, send blinded packet to two independent reviewers, and retain full fail/pass receipts. This step requires actual host/plugin user access and participating reviewers, not additional fabricated sessions.

**No public app listing or v1.0 promotion.** Private installed plugin stays 0.29, public eight-tool MCP 0.4-beta.


## Cycle 0.30 — real media integrity bug fixed; MCP dispatcher CI (19 Oct 2026)

- **Negative discovery:** The former 0.29/0.28 base64 fixture was an invalid 1×1 PNG: its `IDAT` CRC did not match. Legacy tests passed because the bridge sniffed only the PNG signature and IHDR size. This is documented as a real failing previous coverage case, not counted as success.
- Introduced `image-integrity-v030.mjs`: PNG CRC for all chunks, required IHDR/IDAT/IEND structure, size bounds and no extra bytes; JPEG SOI/SOF/SOS/EOI marker envelope. Those checks are not full pixel decoding and cannot prove model perception or film semantics. Replaced synthetic PNG fixture with a CRC-clean one.
- Cloudflare public stateless MCP **0.5.0-beta**, eight tools retained. Validated **59/59 synthetic tests** before restricting public diagnostic routes. Health remains public.
- Added GitHub Actions `REMAKE MCP integration`: **13/13 JSON-RPC dispatcher assertions PASS** (including internal 59/59 tests, tool discovery, a valid image result and rejection of corrupt CRC) in GitHub Actions success run https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39213968454 . The host URL uses a stub/mock PNG, **NOT** a real ChatGPT attachment.
- External unauthenticated diagnostic routes `/_selftest`, `/_core_selftest`, `/_file_selftest`, `/_image_selftest` return 404 unless server secret `REMAKE_DIAGNOSTIC_TOKEN` and the matching header are configured. This reduces unauthenticated test execution on production. CI tests them locally with a synthetic secret.
- Two permissioned real private PNG contact sheets from earlier video analysis were independently verified locally by Pillow and **48/48** PNG chunk CRCs (28+20). They were not copied into public source code or sent to the public MCP. Private REMAKE plugin installed **0.30.0**, release `pluginrel_6ad5c2424a048191932e9772cb8b1b72`.
- **G2.2 remains PARTIAL**: real ChatGPT fileParams delivery, host visual inspection and frame-specific semantic verification not independently tested. **G3 0 independent real reviewer sessions**; G5 real OAuth, G8 brand art, G10 official directory receipt remain blocked.
- **Release discipline added:** green actual dispatcher CI on every version change is mandatory, but not a substitute for external end-to-end and human reviewer evidence. The public website and own GitHub build are not a completed official marketplace release.

Next critical work: connect real host file in supported ChatGPT environment; confirm source SHA256 and model-consumed image with 1/2/7 files; run one authentic eight-turn G3 directing pilot with permissions and then 20×8-turn blind professional reviews. No v1.0 without pass receipts.


## Cycle 0.31 — multi-source fileParams, source-ID fidelity and G8 asset discovery (19 Oct 2026)

- **Feature implemented:** `remake_host_image_batch` is MCP tool #9. It declares `_meta["openai/fileParams"]: ["files"]` with a **top-level array** of user-selected file references, as supported by the current OpenAI fileParams reference. Optional `source_ids` must align 1:1 with the files; absent IDs default to host `file_id`.
- **Creative scope:** zero source images is valid; 1, 2, 7, 35, 100+ images may be used across a creative project. Runtime permits **1–8 images per transport invocation**, with 2 MiB PNG/JPEG image limit and 8 MiB per batch. Divide larger collections across calls, preserving source registry and SHA256; there is **no preset scene/image/script minimum**.
- **Security/consistency:** duplicate source IDs or file IDs, missing URLs, invalid signatures/CRC, untrusted origin and oversized payloads fail without pretending partial visual acceptance. Each result keeps an explicit `source_id → file_id → sha256 → MCP ImageContent` relationship. The model still must truly inspect pixels before reporting `HOST_OBSERVED`. The Worker does not store materials or transfer them to objekts.
- **Evidence:** GitHub Actions [REMAKE MCP integration run 39240250059](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39240250059) **PASS**. Actual JSON-RPC dispatcher test includes 2- and 7-image batches, correct ordering, duplicate rejection and 5 helper suites: **16/16 new batch synthetic + 59/59 existing synthetic**. Integration dispatcher suite: **17/17 assertions**. Live Cloudflare endpoint `/health` reports **0.6.0-beta**, and unauthenticated `/_batch_selftest` returns **404**.
- **Private installation:** REMAKE updated **0.31.0** on existing private plugin ID; verified current release `pluginrel_6ad5f66a6b448191b2d0a230f5936323`. Nothing submitted to a public directory.
- **G8 partial discovery:** studio-hosted assets `https://objekts.ai/media/approved/apple-touch-icon-v37.png` (180×180) and `https://objekts.ai/media/approved/objekts-icon-v37.png` (1254×1254) both returned valid image pages in an independent external fetch; source is official `objekts.ai`. Binary integrity, suitability for OpenAI asset size and user approval for using this mark in REMAKE are **not verified**. No logo file has been installed or modified; never invent a substitute.
- **No unsupported assertions:** actual ChatGPT user image fileParams invocation, model receipt/perception, cross-platform file bridging, external cinematic reviewer outcome, OAuth account memory and official release are **not verified**. G2 and G3 remain PARTIAL/NOT TESTED respectively.

### Next release candidate gates

**G2.2a / G2.2b:** with an independently authorized actual host, run image upload with 1, 2, 7 images, verify returned hash and host visual observation per image; test expired URL, missing fileParam and multi-call 35+ assets. For video, develop a source-timed frame extraction path rather than inferring footage content from MP4 header. Keep host receipts in private evidence.

**G3:** run one non-simulated 8-turn creator session on permissioned footage and have two independent experienced film directors/editors blind-rate camera, blocking, continuity, edit, sound and minimum effective change; then expand to 20 verified sessions. Synthetic dialog harness is not evidence of creative quality.

**G5/G8:** a real OAuth issuer remains absent; verify original v37 icon bytes and direct approval before embedding. Do not call the release 1.0 or submit a public catalog app before passing required gates.


## Cycle 0.32 — public listing preflight must fail closed (19 Oct 2026)

- Installed private REMAKE **0.32.0**: release `pluginrel_6ad5fef1e6f08191ae197f5e1f7a1fda`, same plugin ID. Public MCP server remains `0.6.0-beta` with nine tools; no regression or change in hosted inference claims.
- Official OpenAI release specification requires all four HTTPS links (`websiteURL`, **`supportURL`**, `privacyPolicyURL`, `termsOfServiceURL`) plus an actual packaged primary `logo` and `composerIcon` asset. Added the missing `supportURL: https://remake.objekts.ai/support` to both plugin manifest formats. These four URLs now pass static preflight.
- The actual approved v37 brand icon binary is still unavailable to the development runtime. Its official URLs and dimensions are confirmed; **do not use fabricated simplified circular graphics or claim visual/owner approval**. Both local release preflight and public repo CI correctly classify the official directory candidate as **BLOCKED**: missing bundled `logo`, `composerIcon`, and independent publisher authority receipt.
- Added `scripts/release-gate-v032.mjs` and [REMAKE release gate audit CI](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39245238382). **The green CI means the guard executed and surfaced BLOCKED status, not a public release approval.** Corrected public repository manifest that previously remained at v0.21 to the actual installed private v0.32.
- The last private 0.31 array `openai/fileParams` 1/2/7 scenario tests remain only synthetic. Browser connector was unavailable and user's remote Mac was offline, so **actual installed-host user file transfer and model vision were NOT run**. G3 independent 8-turn reviews: zero. G5 OAuth: no actual provider. G10 official submission: not sent.

### Next P0 release steps

(1) obtain original source v37 icon bytes by an authorised route, confirm SHA256 and square image visually, secure owner approval and install actual files to the package; (2) verify real ChatGPT host fileParams and model-observed image with source hashes, 1/2/7 images; (3) one authentic eight-turn project pilot then 20 real × eight turns, two independent blinded expert evaluations; (4) OAuth user identity/persistence security; (5) submit to OpenAI when criteria truly met. Keep original project source count arbitrary, no compulsory script.


### 0.32a security/release fix: verify live support page (19 Oct 2026)

After setting required `interface.supportURL`, an external availability check detected **HTTP 404** for `https://remake.objekts.ai/support`. The source Worker lacked a support route despite a previous old staging implementation. Fixed the live public Worker at **0.6.1-beta**, then externally fetched **200 /support, /privacy, /terms, /health**. MCP integration CI PASS on the Worker fix: https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39245904967 .

Release gate CI now also probes these HTTPS URLs over the network, so static manifest acceptance cannot mask unavailable help, privacy or legal pages. **G8 remains PARTIAL** until original branded icon files are retrieved and installed. Public directory review still not submitted. `/support` existence does not change G2/G3/G5 acceptance.


## Cycle 0.33 — security first: public CAS revisions limited to drafts (19 Oct 2026)

- Verified security problem in prior G4 implementation: `actor_claim=USER` and an arbitrary string `approval_ref` were accepted by the unauthenticated public MCP `remake_project_apply_delta` to set/remove LOCK or approve/reject decisions, without actual identity. `material_add` could also claim media `OBSERVED` without any pixel inspection.
- **Patched production** `objekts-remake-public` v0.7.0-beta (still nine tools, Cloudflare deployment `4f95f60243fb4aa89510856110594cf5`) with [public-delta-guard-v033.mjs](public-delta-guard-v033.mjs) running **before** the old stateless CAS engine. Only draft `material_add`, `shot_add`, `shot_field_set`, and `decision_propose` remain allowed. Draft sources are USER_STATED/HYPOTHESIS/UNKNOWN, not invented media OBSERVED; only PROPOSED shots may be edited. All approvals, LOCK changes, forged human actors and invalid provenance fail closed.
- **Verification:** GitHub Actions [REMAKE MCP integration success, run 39249304466](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39249304466): **20/20 synthetic public JSON-RPC forged-consent/LOCK/source safety tests** plus previous image and 9-tool dispatcher integration suite. This confirms technical enforcement at the public API boundary, **not** a verified human user, signed approval, or creative usefulness.
- Private plugin upgraded to **0.33.0** on existing identity `plugins_6ad335019d608191a6412d3b59df10e5` (release `pluginrel_6ad6085ee3d48191a7e4b161e8748180`). Updated skill instructs to leave real author approval in the host dialogue as **not yet cryptographically verified**, not to commit it to public MCP.
- **G4 status PARTIAL (security improved)**. Public stateless project packets are still caller-supplied and pre-existing claimed approvals cannot be authenticated. A real auth-bound G5 with explicit human confirmation is required for genuinely authoritative LOCKs and approval/edit history.
- G2 host user fileParams receipt, G3 20×8-turn independent film reviewers, G5 OAuth, G8 original brand binary and G10 official ChatGPT review remain **blocked/open**. No v1.0 and no official publication.

**Roadmap improvement:** authn, author approval, and creative state must be separate planes. A model must be able to propose a change without acquiring edit privilege. All future versions run the 20 abuse regression tests; original brand assets and real host permission receipts remain independent gates.


## Cycle 0.34 — fix bad first-response experience, restructure active skill (19 Oct 2026)

- **Actual user negative signal:** plugin tried by owner; creative quality reported unusable. This is recorded as G3 **FAILED/NOT ACCEPTED from user's actual attempt**, rather than pretending synthetic tests represent usability. The exact failed prompt/output has not yet been recovered, so no claim of reproducible cause or quality win.
- **Concrete product change:** first-turn directing hot path now opens with source observation → consequential viewer-reading hinge → exactly one filmable change (ENTRY/action/EXIT) → trade-off → cheap pass/fail test. Avoids leading with technical build chronology or onboarding; asks max one truly blocking question. Works from idea only and any number of source references, including none. Genuine LOCK, author approvals and source provenance retained.
- Previous installed 0.33 main skill **23,709 bytes**, most of the top loaded with technical 0.21–0.33 chronology. Active 0.34 skill is **8,259 bytes**; old material retained as reference `REMAKE_ENGINEERING_CHANGELOG_0.21_TO_0.33.md`. The new prompt reduces irrelevant technical context but quality impact is a **hypothesis, not externally measured improvement**.
- **Evidence:** reconstructed private local workspace 97/97 Python tests PASS, manifest checks PASS with version 0.34. These validate package/test utilities and do not exercise actual ChatGPT prompt execution. One model-authored paper-edit on owner-permitted ACT/PACK contact sheets used 14 sampled stills, not full video motion/audio and not a two-reviewer evaluation.
- **Installed:** private Plugin Creator version **0.34.0**, release `pluginrel_6ad6804b75b081918a0d380f31350243`, read-back confirmed. Existing public MCP remains **0.7.0-beta**, nine tools, not changed by this prompt-only update.
- **Public source sync:** updated own published GitHub Skills, xAI/Grok fork-local skill and standalone Claude/Gemini extension source branches. These are source deployments, NOT official marketplace submissions, installations or real host trials.
- **Still blocked:** actual installed-host fileParams and visual consumption G2, genuine 8-turn directing pilot & two blind reviewers G3, OAuth user memory G5, genuine v37 packed icons G8, official OpenAI/Claude/Gemini/Grok marketplace submission G10. **No 1.0.**

### New prioritized acceptance

A single authentic source-grounded director answer is required at the beginning; no further growth in plugin metadata should be substituted for creative usefulness. Obtain user's actual failing prompt and answer, rerun on 0.34 in real host, compare factual media accuracy, impact of proposed change, author LOCK preservation, executable shots and one cheap test. If below threshold, keep G3 failed and revise before attempting official release. Then 8-turn pilot and 20×8-turn external blind review.


### 0.34 distribution CI correction

Updating `external_plugins/remake-by-objekts/skills/remake/SKILL.md` changed the description extracted by `scripts/generate-plugin-index.py`. The xAI/Grok fork's `Validate catalog` CI initially **FAILED** because `.grok-plugin/plugin-index.json` was stale. Regenerated its REMAKE record and pushed the index. The latest validator **PASSED**: https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39322359982 . This verifies fork-local source/index consistency, not a merge or official xAI/Grok listing. Keep automatic index regeneration in the next source update.


## Cycle 0.35 — full-export regression and release reliability (20 Oct 2026)

Status: CODE_DONE / LOCAL_TECHNICAL_TESTED, remote CI and deployments pending. No G1–G10 gate promoted to PASS.

- Full current Plugin Creator 0.34.0 release `pluginrel_6ad6804b75b081918a0d380f31350243` exported **before edits**, 86 files, SHA256 `5075b13a288e4906eca96a68423cb92f4f943145a34c3402088784ecf985c1d8`. No overlay treated as a full backup. Existing GitHub starting SHA `fe786db9ef2ebdcd24de7f70138ea4b3bfca4ac4`.
- **Reproducible negative result:** actual full release fails 5/97 Python tests under current local FFmpeg because `-vsync` is no longer recognized. Earlier 97/97 reports remain historical, not current acceptance. Fixed with `-fps_mode passthrough`; candidate **98/98** tests pass, including comparison of extracted PNG pixels to a separate sequential raw decode with frame index and PTS.
- Restored full package source in this existing REMAKE directory; explicit inventory and deterministic complete ZIP builder. Added complete-package CI. This reduces drift between reconstructed test workspaces and actual Plugin Creator files.
- Added bounded streamed HTTP input for public/staging routes: cap actual bytes, UTF-8 validation, deadline/cancellation, redacted errors. **13/13** synthetic stream checks; existing actual local dispatcher **17/17**, public privilege guard **20/20**.
- Found and reproduced staging draft bypass: a PROPOSED shot accepted an invented approval field; rejected-shot edits were not covered by the old account guard. Staging now reuses `guardPublicDelta`, **6/6** synthetic signed-JWT/stub-D1 checks pass. **No real identity, D1 E2E, human confirmation or OAuth acceptance claimed.** Staging remains closed.
- Actual permitted contact sheets inspected by current Codex model, one source-specific proposed paper edit saved privately. Original videos are absent from handoff; PTS imported from historical manifests, not remeasured. **Not installed ChatGPT, no eight real author turns, zero independent professional scorecards.** No private images/video/contact-sheet hashes copied to GitHub.
- Candidate blind-review protocol committed before ratings. Real independent reviewers remain required. Strict publication packaging correctly BLOCKED on original icons and brand-authority receipt.
- Actual ChatGPT browser is logged out; private plugin page cannot load. Required owner action: sign in to ChatGPT in the open browser. Cloudflare Access recheck returns `403 access.api.error.not_enabled`; reconnecting connector is not a fix. Library `files.manage_library` not exposed; canonical Library originals remain pending, not reported updated.
- Task-by-task statuses: [tasks-v1.json](tasks-v1.json). No official vendor submission, approval, publication or independent install exists from this cycle. **1.0 NOT READY.**

Next: green remote complete-package CI → guarded private update and named Worker deployment → actual signed-in host source trial and genuine author iterations → independent professional review; retain all G5/brand/catalog blockers.


### Cycle 0.35 — verified save/deployment receipts

- Source commit: [`d80bfcd4d4ad160008c27e152ad843036a40383e`](https://github.com/peach420fuzz/plugin-marketplace/commit/d80bfcd4d4ad160008c27e152ad843036a40383e).
- GitHub CI SUCCESS: [complete package / 98 tests](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39425442432), [MCP + safety suites](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39425442456), [catalog validator](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39425442402), [release audit](https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39425442438). The release audit is green because it reports missing brand evidence correctly; strict public submission remains BLOCKED.
- Complete 89-file ZIP SHA256 `7d0b3d3e08a7a746841678d535750cc23cf5b71a36272a06611b282a153d8f7b`, identical locally and in remote CI. CI artifact ID `12264264850`.
- Existing private Plugin Creator release updated to **0.35.0**, `pluginrel_6ad764af5198819195ecec36b7187c71`, still USER/PRIVATE. Full saved export SHA256 `090cb53ffef260a2e408458359dd06d478e719403b2e8b0e166eae43ccb9e3b2`. All 89 files preserved; only generated `.codex-plugin/plugin.json` formatting differs, JSON semantically equal. No real installed-host runtime test claimed.
- Public Worker **0.7.1-beta** deployment `87f53299-5614-4c7e-a35a-abe78d9c2770`, serving version `ba96a8a0-1719-4a80-9d08-34e051db2eb7` at 100%. All 8 deployed module sources exactly match tested source. Real HTTPS health, support, terms, privacy and MCP initialize/list verified. Two live HTTP checks with **synthetic** arguments reject forged author LOCK and a >128KiB body; these are not host multimodal acceptance.
- Closed G5 staging safety patch deployment `af9e6df9-ab59-4a0d-80af-2a8a9d3d636c`, version `7daa4fec-131b-4eb9-80cd-d21a82198483`. All 5 deployed sources verified; D1 binding preserved; workers.dev and preview remain disabled. No real IdP, approval UI or public auth-enabled endpoint introduced.
- Original v37 assets downloaded from supplied studio URLs and PNG chunks checked:180×180 SHA256 `c8e6e2b5a0eba929fecd3aa7cf00c8e996977d59086a2d16157306dae7389deb`;1254×1254 SHA256 `7600ae6d67cd0d4ce03f36f4a45667ce78c2e985b2c0276488336b53f976692e`. Owner approval for REMAKE is **NOT VERIFIED**, so these are not added as logo/composerIcon or licensed to any registry.
- Library discovery did not expose canonical `files.manage_library`; originals **not updated**. Private report/source review/export receipts retained in owner's local outputs. Do not substitute another provider's files for Library identities.
- ChatGPT login dialog is open for the owner. Actual private plugin/media trial remains BLOCKED_LOGIN. Local OpenClaw executable found, no actual inference/independent installation confirmed. Claude/Gemini/Grok CLIs not found locally; that does not prove platform unavailability.
- No official submission, public vendor publication, professional human scorecard or independent install created. G1/G2/G4 PARTIAL; G3/G6 NOT TESTED; G5/G8 BLOCKED; G7 NOT VERIFIED; G9 NOT MEASURED; G10 NOT SUBMITTED. **1.0 NOT READY.**

Rollback: original full 0.34 Plugin Creator archive and seven deployed Worker modules retained privately; prior public Worker version `f7844ce2-860c-4767-be1e-7991947bab97`. A rollback was prepared, not exercised. Next product work is the authentic signed-in host trial and genuine author feedback; more synthetic tests cannot close G3.


## Official distribution work — 2026-10-20

- Owner explicitly requested official public submissions on all supported platforms. Internal GPT execution of Director Mode does not require a new OpenAI login. Portal publisher access and review remain separate operations.
- Existing portable distribution synchronized to Director Mode 0.35.0 and MCP 0.7.1-beta. No new product or 1.0 label.
- Preparing a clean xAI official-catalog pull request from current upstream, with a pinned remote adapter subdirectory; no unrelated project history will enter that submission.
- Browser control currently reports `transport closed before response` and no enabled browser. This prevents portal form interaction, not internal skill testing or GitHub/Cloudflare API work.
- Official Gemini gallery documentation uses public-repository indexing with topic `gemini-cli-extension` and a root manifest. A branch-only manifest is insufficient evidence of an indexed listing.
- No official catalog acceptance or submission receipt asserted at this stage.

### Official submission attempts and registry publishing

- xAI clean submission branch `submit-remake-official-035`, SHA `657ea4cde96232eab965fb991a439cb5a282bcb6`; exactly two catalog files changed. Upstream validator and regenerated-index check PASS. Actual `create_pull_request` call to `xai-org/plugin-marketplace` returned HTTP403 `Resource not accessible by integration`; NO PR or acceptance receipt.
- OpenAI public candidate prepared with original v37 icons and 5 positive/3 negative cases; not uploaded. Demo recording URL, portal connection/scans, publisher verification and developer attestations remain incomplete.
- Browser fallbacks checked: CUA transport closed; Opera disconnected; Desktop Commander device offline; TinyFish has no confirmed signed-in profile. No credentials requested or inferred.
- MCP metadata now supplies boolean read-only, destructive and open-world hints for all nine tools. Dispatcher17/17 and public privilege boundary20/20 pass; CI package and MCP pass. Existing catalog CI correctly caught a stale generated index after adapter synchronization; index regenerated.
- Added explicit official MCP Registry declaration for `io.github.peach420fuzz/remake-by-objekts` version `0.7.1-beta`, matching current public server. Browser-free publishing uses short-lived GitHub Actions OIDC; no stored publisher secret. Registry listing remains PENDING until a successful publish and independent public API readback. This does not imply AI-host directory approval.

### Registry attempt and production API compatibility finding

- Official registry pipeline run `39432906604` at `fc7b928b99ed5ee92bf3da2efdb11cde223e001e`: dispatcher/guard PASS, live standard Python HTTP client FAIL403. No registry authentication or publish occurred.
- Exact edge response: Cloudflare error1010 `browser_signature_banned`. Zone `202c8e4302a796990a6203435ba7a078` has Browser Integrity Check on, no user-agent blocking rules, no existing custom/config entrypoint ruleset. Existing named REMAKE client returned200; the Python signature returned403. No global setting changed.
- Prepared narrow custom rule: host `remake.objekts.ai`, exact path `/mcp`, POST/GET/OPTIONS; skip only `bic`, logging enabled. Automatic approval review REJECTED creation because this persistent production security-control change requires explicit owner approval. Rule NOT CREATED. Owner asked for this precise permission; awaiting response. No workaround applied to the publication pipeline.
- Official mcp-publisher1.8.1 binary verified by published SHA256; `validate server.json` PASS. No local publisher login or stored credential created.
- Fixed canonical catalog CI: run `39432906664` SUCCESS. Full-package CI `39432906596` SUCCESS. Core safety-hint change MCP CI `39432325456` SUCCESS.
- ClawHub current publishing source confirms a real skill publish requires a ClawHub token; GitHub OIDC for skills is not supported. No token or authenticated publisher is available. Cursor uses a separate manually reviewed portal. These channels are not marked submitted.


## Candidate0.35.1 — 21 October2026

- Owner's latest instruction reserves the OpenAI upload for final confirmation after preparation. No upload, legal attestation or review submission is claimed.
- Reproduced a real packet-export defect: `compile_portable_director_packet` accepted `CAMERA=static` alongside a shot's `camera=dolly`. It also accepted contradictory repeated LOCK keys and duplicate shot IDs. The compiler now rejects exact camera/sound conflicts, contradictory normalized lock values and duplicate shot IDs. Semantic cinematic consistency remains outside this structural check.
- Corrected public reviewer case5: title-renaming events are unsupported. The case now creates a draft, adds a PROPOSED shot, revises its camera field with correct returned revisions, and validates revision3. Case4 now checks actual legacy packet fields (`approvals=UNVERIFIED`, `studio_handoff=NOT_REQUESTED`, `sent=false`), rather than an invented canonical handoff object.
- Added11 synthetic contract regressions: PASS. Existing dispatcher17, public guard20, stream13, staging boundary6 and complete Python98 checks PASS locally. No saved OpenAI-host routing or human film-quality acceptance inferred.
- Public build now derives from the complete source inventory, includes unchanged SHA-pinned v37 PNGs, verifies CRC/dimensions/listing/category/case counts and prohibits private App bindings. It omits redundant private compatibility manifests from the public copy. Two public builds match exactly. Remote CI and deployment still pending at this entry.
- Rechecked another owner's existing plugin workflow: MARKETS used the actual OpenAI portal and has a saved draft; this confirms the workflow, not REMAKE upload. Browser connection was recovered after CUA reset, but its inventory exposed only the in-app browser. The user requested no embedded-browser opening; no new tab was opened. No independent recording facility was established.
