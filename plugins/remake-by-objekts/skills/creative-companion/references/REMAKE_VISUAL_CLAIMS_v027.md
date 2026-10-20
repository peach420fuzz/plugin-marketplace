# REMAKE — frame-grounded visual claims v0.27

## Product boundary

REMAKE is by **objekts**. This module checks that a *declared* visual observation points to a specific original video and inspected local PNG sample: source SHA-256, decoded frame index, FFprobe PTS and PNG SHA-256. It cannot verify what a picture shows, the truthfulness of observer's declaration or a person's identity. It never transmits client material.

## Minimal real-media workflow

1. Work only with source material that the creator may analyze. Use local `remake_media_evidence_v026.py` to produce a source manifest and a small sample of extracted PNG frames.
2. Show those exact images to the actual model or qualified reviewer. Note the *exact* source/frame IDs and PTS that were really viewed. A filename, video metadata, or text description alone is not host perception.
3. Log a short precise fact as `HOST_OBSERVED_FRAME` only for observed frames, bound by source/frame SHA and PTS, with `review_surface=RENDERED_FRAMES_VIEWED_IN_CURRENT_SESSION`. This field is self-declared and is never proof of a verified model execution.
4. Keep other observations separate as `USER_DESCRIBED`; ideas and editorial hypotheses must be `MODEL_HYPOTHESIS` with `decision_status=PROPOSED` or `UNDECIDED`, not `USER_APPROVED`.
5. Validate using `scripts/remake_visual_claims_v027.py` and inspect all errors/warnings. Any mismatch in file, frame ID, PTS, SHA, approval status or source name is a blocking error. Even a clean structural result does **not** prove image semantics or guarantee production quality.
6. Use the resulting linkable facts in a paper edit; make any suggestion a hypothesis tied to the precise shots and authorization constraints. User choices and original LOCK constraints remain independent.

## Sample limit is not a project limit

`remake_media_evidence_v026.py --samples N` accepts 1–32 decoded frame samples **per media file** as a local resource safety limit. REMAKE itself must not require a particular number of images, scripts or film clips. For long videos or multiple videos use several disjoint frames/subclips and explicitly record what was not inspected.

## 1.0 acceptance status

- `G2.1 LOCAL`: actual uploaded media decoded, source/frame hashes verified and at least a subset of rendered images viewed in the CURRENT evaluation conversation. First internal example executed with two existing objekts Library video files: 14 sampled PNG frames (8+6), five source-grounded visual claims. Source files and contact sheets are **not included in distributable packages**.
- `G2.2 HOST`: **not achieved** in installed ChatGPT/Claude plugin; the private skill does not automatically execute FFmpeg or receive frames via its remote MCP. Test real installed-host calls before claiming successful cross-network video understanding.
- `G3 QUALITY`: **not achieved**. Observations are an internal engineering test, not reviewed by an independent director and not a claim that the film cut is approved.
- Approved objekts studio assets, creative rights, original brand mark and human approval must be verified separately.
