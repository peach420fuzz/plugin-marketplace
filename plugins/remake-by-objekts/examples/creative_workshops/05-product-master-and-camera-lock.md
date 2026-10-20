# Creative workshop E — condensation on a product jar, one controlled 10s loop

**Status:** original fictional scenario created solely for training. No real client, packaging, footage, numbers or business claims. The author owns a product design and a locked camera position; the input is a textual draft, NOT observed renders.

## Actual problem presented to Companion

> “I have three concept frames for a jar on a dark stone table. One bare hand wipes condensation off the glass, revealing the logo. Ten seconds, seamless loop. Camera and packaging cannot change. The hand looks good in one still. How do we animate it without losing the product?”

**Correct first diagnosis:** there's no evidence the existing still is defective. The risk is in the **temporal boundary**: wiping the jar changes condensation, hand overlap, and specular highlights. A 10-second seamless loop must also restore its initial state somehow. Camera and product are explicit LOCKs, not optional improvements. Ask for the actual frame and product master before specifying exact appearance.

**Two different directorial mechanisms, each with a cost:**

- **A — reversible gesture:** the hand traces across a small part of the jar, then returns via a motivated reverse motion before the loop boundary. Viewer understands purposeful reveal followed by concealed reset. Aesthetic cost: the reverse may feel demonstrative. Production cost: exact contact and reversible smear masks; the same finger topology and product geometry are needed across the wipe.
- **B — offscreen temporal seam:** reveal and hold, hand exits. At the loop boundary an authored offscreen condensation reset occurs while maintaining camera/object identity. Aesthetic cost: the reset is a deliberate temporal ellipsis, not naturalistic continuous time. Production cost: both end/start edges must match geometry, contact-free specular alignment and ambient sound; temporal seam may be visible in reflections.

Neither is `APPROVED`. Do not propose rotating the jar for a better beauty angle, moving the camera, redesigning label typography or changing the material to make AI animation easier.

## Playable mini-treatment — A, 10-second proposal

| Time allocation (proposed) | Visible state & actor action | Spectator's new information | Downstream control |
|---|---|---|---|
| 0–2s | Product jar in fixed camera, condensed surface. Hand enters from edge, approaches glass | Surface will be touched | Camera/object LOCK, hand scale and shadow contact |
| 2–5s | Thumb/forefinger wipe a small controlled arc | Concealed mark is revealed, without creating a new label | Wipe mask constrained to real label master; hand occlusion/contact |
| 5–7s | Hand pauses and withdraws, product holds | Product identity is visible long enough to read (must be tested) | Logo legibility/safe area; glass reflection behavior |
| 7–10s | Small returning motion or a planned masked reset | Re-establish loop's entrance state | Last/first-frame pixel and optical-flow inspection; sound tail |

**Important:** timings are proposed; no original footage has been measured. Before production, choose A or B and decide whether the loop may use an invisible ellipsis. Do not claim exact logo readability from a described image.

## Actual department contracts (not a prompt checklist)

1. **Creative direction:** approve the mechanism and whether reversibility belongs to film language. Exit: single viewer action and loop logic.
2. **Product/canon authority:** approved label design, material roughness, jar proportions, reference straight-on view, and permitted condensation regions. Exit: a verified product master, not a random AI render.
3. **Performance/blocking:** hand ownership and entry side, path, contact points and exit; ensure the gesture can be described physically to animation. Exit: gesture diagram with entry/exit states.
4. **Art / materials:** plausible glass, condensation/clear area, contact shadow and reflection behavior. Exit: a single wipe test at camera lock.
5. **Cinematography:** locked perspective plus an authored light hierarchy; no invented lens metadata. Exit: static shot scale and product readability proof at intended display size.
6. **Animation / AI-VFX:** define invariant jar/label/camera masks, hand identity controls, overlap and reflection tests; prefer a short critical-contact PoC rather than ten seconds of uncontrolled generation.
7. **Edit / sound:** loop entry/exit continuity, on/off sound, timing and audience legibility. Exit: seam comparison and timing verdict based on actual rendered edges.
8. **QC / delivery:** fail on altered geometry/text or visible reset inconsistent with chosen approach. Handoff should distinguish **KNOWN SOURCE** from **PROPOSED** values.

## Adversarial follow-up (author decisions)

- Author: “Make the label larger so it reads faster.” Assistant: “That conflicts with your packaging LOCK. I can instead adjust the **exposure/hold duration or crop**, if your camera lock allows reframing; otherwise readability is a constraint to test, not permission to modify label.”
- Author: “Can the motion model invent droplets and fix the glass?” Assistant: “Only outside locked product/label regions and only after an A/B proof of stable geometry. The correction must not change approved pack. A short offline contact test is safer than a full shot.”
- Author: “Just deliver four different beauty shots.” Assistant: “The current request is one locked-camera loop. Four angles require an explicit scope/LOCK change; I won't silently replace it.”

## Five-minute teach-back exercise

Draw the **first, contact, release and last** frames as four tiny squares. Write one immutable item in each (jar silhouette, logo layout, camera perspective) and one changing item (hand pose, moisture). If the last square cannot become the first without changing approved geometry or authored time, the loop architecture needs a decision before generation. This exercise is useful without buying anything from objekts.
