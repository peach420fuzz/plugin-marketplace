# Media evidence → directing decision · v0.14 (separate offline local tool)

## Product boundary: no fake visual analysis

The private ChatGPT plugin is a **skill-only directing tutor**. It does NOT execute FFmpeg, access the user's private files automatically, or call the local web tool. A separate **opt-in local video reviewer** in the full source archive (`media_review/`) can examine an uploaded MP4/MOV on the creator's own machine and generate an evidence JSON + real-frame contact sheet + editable HTML report. The creator may then paste/select that report for the Companion. Do not assert that the plugin itself ran the reviewer or saw its clips unless actually given the results.

The local tool is a **measurement aid, not an AI director**: decode-based duration, candidate discontinuity timestamps, static image intervals, audio quiet periods, real frame samples. No semantic product/identity/object understanding, no ad recall, no automatic narrative critique, no license or source validation. A cut detector can fire on an effects transition or flash. Static footage can be an intended cinematic hold. No quality score.

## Production review: the three passes

**Pass 1 — Source authority.** Identify file version (`SHA256` from actual uploaded bytes), metadata and exact measurements. Different hashes are different stimulus versions. If user supplies just words about a clip rather than video/report, use `AUTHOR_DESCRIBED`, NOT `MEDIA_OBSERVED`. Never assert specific timestamps without supplied markers.

**Pass 2 — Viewer-facing question.** Before prescribing a fix, ask: what viewer information should change at this exact moment? What is definitely visible in an attached authorized screenshot vs only the author's intention? Connect cut/hold/quiet audio to *one* testable hypothesis, not a diagnosis of failure. If the author explicitly wants ambiguity or contemplative duration, respect it.

**Pass 3 — Two-tier editorial action.** First test cheapest reversible edit/sound/crop/hold change; use generation/VFX only when source cannot achieve the author-approved state. Show author:

- **Source**: exact reported timestamp, detected event, provenance (`MEASURED`, `HEURISTIC_MEDIA_SIGNAL`, `AUTHOR_DESCRIBED`, `MODEL_HYPOTHESIS`). Quote verified notes or show thumbnail if actually available.
- **Narrative stake**: precise viewer change that might occur, expressed conditionally. State the maker's goal and what must remain unknown by intention.
- **Minimum intervention**: an actual edit/blocking/graphic/sound operation. Avoid generic “more cinematic/dynamic.”
- **Artistic alternative**: a different grammar/point of view if appropriate, including cost to authored rhythm and production cost.
- **Production test**: smallest contact-sheet, shot-boundary, muted playback, approved pack master or test-viewing proof that could falsify the hypothesis.
- **State**: all proposed edits are `PROPOSED`; user is owner. Preserve `LOCK`, negative canon, rejected routes, and edit-dependency changes. Never hand off without separate request and specific approval.

## Case calibration, source-only synthetic demonstration

The included generated four-second MP4 uses 2 s of flat red, then 2 s of flat blue (no people, product or actual brand). The local tool measures **4.00s**, detects a **candidate boundary at 00:02.00**, finds two **static intervals**, and reports a 1 s mismatch **when and only when** the fictional creator asks for 3 seconds. It does **not** establish whether the cut is purposeful, confusing or artistically good.

An acceptable Companion response to this report:

> I can verify the 4.00 s runtime and the visual change candidate near 00:02.00. I cannot infer a product, story, audience reaction or an actual editing error from these signals. If your intended effect is a sudden transformation, the next useful test is whether that instant contains the information you want the viewer to register. A possible minimal experiment is a new 3.00 s paper edit with 1.5 s before/after. An opposite option is to preserve the 2+2 second meditative pace and change the target slot, if your distribution format allows. Neither is approved yet.

The 1.5+1.5 s alternative is **a proposed edit**, not a verified improvement; it changes the hold and may weaken intended contemplation.

## Use with real commercial files

For a provided 15 s product spot, a *real* report could flag a static area or cut at 00:12; it may NOT identify “product introduced at 00:12” unless visually observed from permitted frames or explicitly annotated by the user. A provided approved pack master is needed for geometrical/logo fidelity; the video detector does not verify it.

For a poetic short film, don't infer a missing motivation from a deliberate image hold or associative transition. The proper test may be whether a formal change registers, rather than whether a stranger can explain plot causality.

## Version comparison

Offline `media_review.revisions.compare_evidence(before, after)` compares **different SHA256 files** and reports changes in duration and candidate boundaries. It never says the revised film is better. For an actual audience test, keep media version and anonymized responses separate. Do not process media for storage, marketing or model training without rights/consent.

## Limits of this deliverable

- Fully local, opt-in: users run `uvicorn media_review.app:app --host 127.0.0.1 --port 8891`; browser at `http://127.0.0.1:8891`.
- The upload route streams up to 60 MiB, supports a maximum 90-second 3840×2160 source and deletes temporary files after responding. Those are **configured safety ceilings**, not performance guarantees across laptops.
- No speech transcription, no music licensing check, no automatically inferred cause/effect or brand presence, no remote project memory, no Production Desk/FAKE dependency.
- The local HTML report is exportable; user can voluntarily share the evidence with another creative person. No external upload happens via this app.
- Frame seek images and automatic boundary detection need manual confirmation at original resolution / native frame rate. The user must still watch/understand the actual material.
