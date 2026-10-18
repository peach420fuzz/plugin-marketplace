# REMAKE media evidence v0.26 — opt-in local codec analysis, not host-runtime perception

**Publisher:** objekts. **Status:** engineering beta / G2 PARTIAL.

## Boundary
- This file ships a local Python/FFmpeg tool. A plugin instruction cannot execute it by itself in ChatGPT, Claude, Gemini, or Alice.
- No user media is uploaded by this utility. No extracted frame is claimed seen by any AI host until that host has actually received and inspected its pixels.
- A provided video can be genuine but creative/directorial interpretation remains unverified: video duration, frame PTS, dimensions, audio track and hashes do not identify people, products, acts, cuts or quality.
- No implicit rights clearance; the creator must have permission to process the source.

## Usage with an authorized locally available source

```bash
python3 scripts/remake_media_evidence_v026.py VIDEO.mp4 --out evidence --samples 6
```

Output `evidence/manifest.json` and PNG frames. The sample count is an execution-safety option from 1..32, not a cap on how many creative references a project can contain. Source bound: <=60 MiB, <=90 seconds and <=3840x2160 as a local execution limit. Long projects must be handled through licensed, deliberate chunks and each source must be identified. Do not silently trim.

To verify hashes after file transfer:

```python
from remake_media_evidence_v026 import verify
print(verify('evidence/manifest.json', 'VIDEO.mp4'))
```

SHA-256 checks let the reviewer tell whether the delivered source and sampled PNG files still match the measured version. They do not prove license, provenance from a camera, or creative meaning.

## Binding with the canonical project

Create a material record with `id`, `kind=video`, `provenance=USER_PROVIDED`, `evidence=USER_STATED` and `host_inspected=false` until the host truly sees the data. Store `source_sha256`, `schema_version`, exact PTS samples and frame SHA256 in a separate evidence attachment referenced by the material ID. The source is not automatically `OBSERVED` merely because ffprobe read the bytes. If/when the host actually sees frames, annotate only frame-specific observations with their frame IDs/PTS; do not promote an entire video or audio transcript to seen without inspecting it.

## Measured test evidence

Synthetic video generated locally with FFmpeg has real decoded 320x180 frames, H.264 not assumed (mpeg4 codec used in test), 12fps and AAC audio. 15 unittest cases pass: timestamp ordering, source integrity, frame digests and tamper detection, missing/corrupt media, no-audio case, size/time control, symlinks and explicit no-semantic/no-transcript output. No permissioned real film has been decoded by this build's runtime. G2 remains PARTIAL.

## Next gates

1. Obtain explicitly authorized real MP4/MOV/WEBM, store source checksum (as supplied by owner), measure it in sandbox, inspect selected frames in actual AI-host; save per-frame observation evidence and negative hallucination checks.
2. Extend to audio content only after valid decoding/transcript source is truly available; audio stream existence is not a transcript.
3. Choose host-native media processing vs opt-in ephemeral processor, document rights, limits, deletion TTL, network egress. No collection/storage by default.
4. Independent blind directors/editors must judge a real 8-turn session in G3; technical media receipts do not substitute.
