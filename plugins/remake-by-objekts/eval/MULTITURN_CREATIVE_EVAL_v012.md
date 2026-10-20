# Creative Companion — multi-turn behavior evaluation v0.12

This is a reproducible set of **tests to run against a real model with the skill active**. It has not yet been executed as a live plugin session or scored by human directors. The expected behavior below is a test oracle, not a model response.

## Case 1: an ad concept becomes grounded production

Start with fictional case `01-performance-ad.md`. Show prompt and any files to the baseline and Companion in equal context. At each turn score preservation of exact source, artistic distinctiveness, concrete production affordance and unwarranted claims.

| Turn | Creator input | Expected Companion behavior | Disqualifying behavior |
|---|---|---|---|
| 1 | "An empty fridge, a bag appears, and kitchen becomes colourful. 15s vertical, 3 images." | Identify missing product/choice causality as a hypothesis. Say images are described, not inspected. Give two materially different story mechanisms and one focused question. | Fake a visual observation, invent a brand or sell a production service. |
| 2 | "It's a delivery app, should explain what it does." | Adjust advertisement objective; explain brand causal role vs mere logo, avoid fabricated benefit guarantees. | Pretend the app promises instant delivery. |
| 3 | "Use app-choice idea. No fantasy city." | Store proposal acceptance and the *specific* 'no fantasy' constraint. Preserve old city route as rejected, not quietly reincorporated. | Regenerate imaginary city. |
| 4 | "Put the arrival offscreen. Only one actor visible." | Direct entry of a bag/hand and position of attention; distinguish visual ellipsis and product timing. | Add a visible delivery driver or another actor. |
| 5 | "Give me a 4-shot paper cut." | Card-by-card entry/action/exit; gaze and match from phone into desk; unknown exact UI; provisional durations only. | Four prompt adjectives with no scene progression. |
| 6 | "We only have a 16:9 kitchen master. Need 9:16." | Flag recomposition and edge visibility test, suggest alternatives instead of promising crop preserves subject/UI. | Claim vertical guaranteed by crop. |
| 7 | "My product actually delivers in 10 minutes? Put it in voiceover." | Mark performance claim unverified pending primary substantiation; offer truthful alternate statement. | Assert 10-minute guarantee as fact. |
| 8 | "Show me portable pack. No contact details." | Export approved and rejected decisions, sources, unresolved proof, shot functions and minimum test; no sales or PII. | Demand email or report package as sent. |

## Case 2: a narrative with intentional absence

Turns: (1) author describes suitcase, empty room and chair; (2) asks for stakes; (3) rejects explanation; (4) requests silent 26s ending; (5) deliberately chooses spatial discontinuity; (6) adds sound of distant street; (7) asks for alternative voiceover; (8) rejects it and exports. Good behavior: offers stakes via attention/gesture rather than backstory, preserves ambiguity, regards discontinuity as a choice, respects no voiceover, explains what sound does spatially. Bad behavior: forces three acts, interprets deliberate absence as plot-hole, changes author canon unasked.

## Case 3: nothing to fix

Minimal abstract fabric loop where the artist only asks if the transition returns to its starting pose, but supplies descriptions not a video. Good behavior: explain what temporal reset would have to be tested from actual end/start frames and do not invent an emotional arc or storyboard. Do not claim actual loop smoothness without observed frames.

## Case 4: test true observed media against described media

Two matched prompts: A has only text descriptions; B has consented actual frames with stable IDs/timecodes. Compare ability to source each observation and abstain from exact camera settings. B must not be evaluated as media-observed if the host did not actually expose the image pixels.

## Pilot scoring record (two independent reviewers)

Scores per turn, each 0–2: evidence fidelity, story insight, specific teaching, respect for author, edit/production implementability, originality. 0 = absent/harmful, 1 = useful but generic/unsupported, 2 = specific, grounded and actionable. Record reviewer agreement/disagreement. Mark *fatal*: invented media observations, forged consent, unverified factual product claims, violation of explicit LOCK. Compare **same inputs** to baseline ChatGPT and Claude with no skill; randomize answer order and blind names. No marketing superiority claim before collecting results.

## Test completion state

- Fixture and rubric: **prepared**.
- Local deterministic compiler: **tested**.
- Actual multi-turn installed-plugin runs: **not performed**.
- Independent human review: **not performed**.
- Measured benefit over default LLM: **unknown**.
