# REMAKE by objekts — release gates for 1.0

Owner criterion: **useful, public, independently testable professional directing product**, not a disguised advertisement and not a prepackaged prompt.

Status is only **PASS** when test evidence, build SHA/version and an external receipt or reproducible artifact exist. No estimate of completion percentage without measured test basis.

| Gate | 1.0 acceptance | Current verified state (2026-10-18) |
|---|---|---|
| G1 Source ingestion | Zero, 1, 2, 7, 35, 100 images, storyboard PDF, real audio and real video, arbitrary script/no script; tested inside host; cite observed vs unseen by asset ID | Written skill supports all; public MCP handles descriptions only; host tests **NOT RUN** |
| G2 Real media ground truth | Can read *actual* images, extract timecoded frames/audio under permission; never invent PTS, scene, transcript; independent failures logged | New offline ffprobe helper tested synthetic clip; **NOT CONNECTED TO HOST** |
| G3 Creative work | 20 diverse permissioned projects × ≥8 conversational turns, blind review by at least two experienced directors/editors, revision appropriateness and viewer legibility scored; 0 critical hallucination/LOCK violations | Authored examples only, **0 independent user sessions confirmed** |
| G4 Canon/revisions | One canonical packet format; no silent product/camera/character LOCK edit, no fake approvals, rejected options stable, reversible revision log; migration covers supported legacy formats | v0.23 local guard and pure delta state machine with 59 synthetic tests; server integration absent |
| G5 Cross-chat project accounts | OIDC/OAuth host verified identity; per-tenant D1 isolation, create/open/list/edit, revision CAS, export, permanent delete; security penetration checks; test no cross-user access | Separate credential-gated staging with D1; **not consumer-connected** |
| G6 Video / scene workflow | Beat/shot time sequence, spatial blocking, editorial cut/sound continuity; project export can be handed to independent production team with only known source facts | Methods exist in instructions; outcomes **NOT INDEPENDENTLY VERIFIED** |
| G7 Multi-network access | Tested actual user execution in ChatGPT, Claude, Gemini and at least one additional platform; Alice/other integrations tracked honestly as separate submissions/adapters | GitHub source published; **no directory-wide launch** |
| G8 Trust, brand, safety | Approved original objekts v37 logo displayed as intended, security/privacy/ToS/support accessible, transparent studio identity and no hidden project forwarding, review package meets official policy | Website and legal pages exist; **original logo asset not verified** |
| G9 Product analytics | Measured real useful sessions, returns and explicitly opted-in studio enquiries without gathering confidential scripts by default; failures included | None measured |
| G10 Official release | All critical gates pass; OpenAI public submission approved with release receipt; directory install by unaffiliated user verified | NOT SUBMITTED/APPROVED |

Immediate sequence: (1) establish a canonical data contract and observable offline media evidence; (2) integrate authenticated state into test host; (3) run blind directing/LOCK evaluation and iterate; (4) harden security/privacy and test across hosts; (5) submit public applications and validate installs. Never relabel 0.2x as 1.0 for marketing convenience.

Evidence: v0.23 local engineering tests are synthetic unit/integration tests, not production deployment, independent model evaluation or official directory certification.
