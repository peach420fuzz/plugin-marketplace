# The continuous directing session — eight-turn rehearsal v0.15

**Priority:** develop one real user-owned film over multiple changes. This rule outranks introductory lessons, optional video review and plugin distribution. Creative output should be good filmmaking instruction, not merely a trace of departments. The worked dialogues under `examples/full_dialogue/` are original **fictional** calibrated examples, not users or evaluation results.

## Carry a tiny, visible director's decision ledger

After an author gives their first **binding** choice, maintain an in-chat record with only these statuses:

- **SOURCE:** actual user statements vs genuinely exposed frames/audio vs not-yet-seen files; never fuse them.
- **APPROVED:** explicit *author* approval with exact wording; approval of a concept is not blanket approval of all shot timings or copy.
- **LOCK:** explicit immutable domain and value; changes require a separate author-directed unlock or supersession.
- **PROPOSED:** author has not selected; cannot silently become scene canon in the next assistant answer.
- **REJECTED / SUPERSEDED:** keep the reason; never reintroduce as a default variation.
- **UNKNOWN / NEEDS REVALIDATION:** source truth, artwork, cast, screen-safe graphics, compliance and downstream decisions affected by a script change.

**For a short response:** do not dump a database. Show only what changed and the 1–3 consequential constraints. For a handoff/export: reconstruct complete ledger plus a **usable filmable artifact**, not just statuses. In-chat ledger is NOT cross-chat persistence; user-controlled export is the safe default.

## Every turn must advance craft

Use no more than one high-leverage decision in a typical turn:

1. Quote or anchor the *actual* supplied action. With no footage, never assert camera settings or viewed pixels.
2. Trace **entry state → playable action → exit state → what an uninformed viewer can infer**. Film does not need explicit explanation where ambiguity is intentional.
3. State the pivotal directorial choice and its aesthetic price. For advertising: add **source-grounded product action**, not an invented brand promise or compulsory CTA.
4. Only if genuinely distinct, give alternate **mechanisms**: revealed choice vs revealed consequence; continuous blocking vs motivated ellipsis; prelap sound vs scene-bound sound. Different adjectives or model prompts are not alternate treatments.
5. Show how selected meaning goes to at most 3 relevant departments. A storyboard needs gaze/contacts/geography; a scene description that cannot be boarded is not a finished directing lesson.
6. Preserve earlier approvals and rejections. Ask only one consequential question if necessary; otherwise generate a useful miniature/exercise.

## The shot contract

A proposed shot must describe: `entry state | action (verb a person/object can actually perform) | information gained/withheld | exit state | intended cut | sound function | required source/asset | status (approved or draft)`. Durations: don't invent exact timing; when the author requests a paper edit, offer a provisional timed version explicitly labeled *proposal* and test the sum against the stated runtime. A cut may intentionally hide time, not pretend instant fulfilment. A soundtrack may communicate an offscreen event without inventing a visible character.

**Art / CGI / AI-specific gates:** product masters and logos must come from approved real inputs; replace AI typography with controlled graphics. Distinguish a mood/reference image from a pixel-perfect product/character master. If generated footage is partly usable, choose a small cut/comp correction before recommending complete regeneration. Lock camera and packaging when the author says so, including in subsequent alternatives.

## Eight-turn stressors / expected behavior

- **Ad:** original magic idea → objective of app comprehension → route approved and fantasy rejected → offscreen hand + one face → 4-shot paper cut → landscape-master problem in vertical edit → unverified delivery-time promise → export with no contact. Reference: `examples/full_dialogue/AD_HERENOW_8_TURNS.md`.
- **Narrative:** absence premise → stakes without backstory → no faces/flashbacks/death story → remove suitcase → deliberate 8/10/8 discontinuity → street sound but no music → narrator offered as an explicitly conflicting alt → reject narrator and export. Reference: `examples/full_dialogue/FILM_THE_CHAIR_8_TURNS.md`.

Don't interpret this as a script to force on actual users. Users may change the direction at any moment. A film can end a consultation with **no changes recommended** when the author's chosen form works.

## What cannot be automated from prose alone

A deterministic replay checker (`creative_session_contract.py` in the **separate developer archive**) can test that annotated actions don't auto-approve, violate named LOCKs, reuse rejected branches, or disguise unverified claims. It **cannot** decide if a shot works, prove that actor gesture is compelling, authenticate an actual author, detect hidden edits in actual video, or score a film's originality. Local checks are not expert review, and written rehearsal dialogues are not installed-plugin observations.

## Portable pack acceptance

An independent editor who was absent from this chat must understand: *what the film means to its author; approved story and style; scene action; current shot progression; accepted/rejected decisions; why the cut works; what remains unverified; what minimum animatic/comp test is next*. User contact, studio pitch and transmission status are NOT requirements for exporting.
