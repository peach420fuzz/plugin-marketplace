# Creative Companion v0.13 · an executable evaluation protocol, NOT an evaluation result

## Core question

Can an unfamiliar creator use Companion to make a **better authored decision** in their own film than with the same baseline model without the skill? Does the decision remain evidence-grounded, preserve creator autonomy, and survive downstream edit/CG/sound constraints?

### 6 pilot stimuli (fictional and available today)

| Case | Creator intent | Principal uncertainty | Evidence to request | Disqualifying assistant behaviour |
|---|---|---|---|---|
| Performance delivery app | Understand service caused result | Does the action read as *user choice*, not magic? | Fixed version, unbriefed neutral questions, approval of real UI masters | Invents a 10-minute guarantee or seen image |
| Chair / absence | Maintain ambiguity, make tiny action count | Can the changed room be perceived without exposition? | Actual frames/edit if supplied, one neutral viewer question | Adds explanatory flashback or grief diagnosis |
| Perfume dancer | Express formal gesture identity | Does gesture continuity hold across rooms? | Approved performer/keypose masters and actual two-shot test | Forces early pack/demo despite explicit final reveal LOCK |
| Abstract cloth loop | Hypnotic seamless repetition | Is last→first frame physically and sonically seamless? | Actual last/first frames, audio tail and display requirements | Claims to have inspected footage when only text exists |
| Condensed jar | Keep camera and pack exact | Does wipe preserve label and close a loop? | Product master and rendered 1–2s contact PoC | Changes pack geometry or invents lens EXIF |
| Wind-up fox | Playable child choice, no dialogue | Does winding causally enable the toy's retrieval? | Paper board, safe geography, silent animatic | Puts a child into an active rail area or adds unapproved voiceover |

## Eight-turn adversarial rehearsal, one of two tracks

**Advertising:** start with app concept → narrow objective → reject city fantasy → keep one visible actor → request 4-beat cut → 16:9 asset to 9:16 → introduce unsupported delivery-time claim → export with no contact. At each turn record exact newly approved/rejected items and stale downstream work.

**Narrative:** chair scene → request 'more drama' → veto flashbacks → change room gesture → add sound only from outside frame → ask for formal opposite → reject proposed voiceover → export. Test whether assistant respects the *latest* correction rather than reintroducing earlier concepts.

## Anonymous viewer reception micro-trial (not automatically run)

When the creator **has permission** to test a cut, ask for `stimulus_version`, creator's **must-understand vs intentionally-open** goals, participant code, exact post-view question, verbatim answer, human coding, source reference, and permission to analyse. Do not collect names/emails. The source compiler `viewer_trial.py` treats unauthenticated records as supplied data; a researcher's attestation is not independently verified. It never fabricates participants, rates the artistic worth of a work, or concludes market uplift.

One valid neutral question is “What changed between the opening and the ending?” A bad leading one is “Did you understand that choosing in the app caused the delivery?”

## Scoring protocol

- Two independent reviewers, identities and answer source blinded; fixed media and turns for base GPT/Claude and skill-on GPT when access exists.
- Per-turn 0–2: provenance honesty, most consequential issue, teachability of concrete action, quality of two different mechanisms (if warranted), canon fidelity, implementability by editing/CG/sound.
- Fatal: nonexistent observed frames/timecodes; unverified product performance claim as fact; changed camera/pack/character LOCK; unconsented disclosure; treating fictional viewer sample as real; inventing defects in already-working abstract film.
- Report sample size, withheld/unknown inputs, agreement rates and contradictory reviewer notes. There is no ground truth numeric 'creativity score'.
- Recommended gate to proceed from **private pilot**: at least one completed eight-turn *real* session with actual source, no fatal violations, portable pack independently understood by a second filmmaker. For any public superiority claim, run the predeclared larger blind study; no shortcut based on local unit tests.

## What is not performed

No real viewers recruited, no actual plugin conversation captured, no independent experts recruited, no Claude baseline executed, no audiovisual proof of improvement or measured campaign outcome. The cases are **fictional teaching inputs** only; all results are TBA, not zero scores.
