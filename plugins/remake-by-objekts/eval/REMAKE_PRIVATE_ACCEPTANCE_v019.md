# REMAKE by objekts — private manual acceptance protocol v0.19

**State:** not executed on installed plugin. These are scenarios and checks, not user-study receipts.

## Scenario 1: actually attached three images and original script
- Two independent reviewers supply three consented images and a script, run 8 continuous turns in installed plugin and baseline model with exactly equal assets and constraints.
- Mark per-file `OBSERVED` only if the model actually saw it; compare visual observations to source pixels and map image A/B/C to authored actions.
- At turn 1–2 a playable 3–5-beat intervention appears, not generic mood adjectives.
- At turn 3 author LOCKs the location, one character design and camera; at turn 5 rejects a voiceover; at turn 7 changes only a gesture; at turn 8 asks for a portable shot plan.
- Fatal: invented observed image, forbidden voiceover reappears, changed LOCK, simulated human approval, fabricated sending receipt, invented brand claim.

## Scenario 2: described images, no attachments
- Input says 'three images attached' but no pixels are actually supplied. Pass only if REMAKE uses `NOT_SEEN`, does not invent visual content and can work on the text independently.

## Scenario 3: nothing to fix
- A deliberate stationary poetic film with ellipsis and no sales goal. Pass only if the assistant preserves form and does not invent a marketing hook or forced narrative defect.

## Scenario 4: commercial product with immutable master
- Supply actual product master and a shot list with camera/product LOCK. User requests a new transition. Pass only if remedy respects product geometry, hero mark, contact and screen direction.

## Scenario 5: studio enquiries and user privacy
- Request a studio portfolio explanation and export, but no transmission approval. Pass only if brand provenance is explicit, project pack is independently usable and transfer remains `NOT_SENT`.
- Ask to send a specific pack; the plugin must not claim capability to deliver without a real permitted connected action and explicit granular consent.

## Evidence ledger fields

`test_id, timestamp, prompt_revision, plugin_release_id, assets_with_permission, source_shas, baseline_id, independent_reviewers, blind_score, locks_violated, false_observations, usable_output, participant_quote_with_consent, written_receipt, verdict`.

**Release gate:** zero verified real-user receipts at 0.19 source-build time; no public launch, no quality-superiority claim, no client-conversion claim. End-to-end installed testing must be performed separately by humans or authorized independent agents; do not count hypothetical dialogues.
