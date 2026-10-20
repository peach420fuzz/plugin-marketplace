# REMAKE G2 — 0.26 local media integrity test receipt

Status: ENGINEERING PASS / PRODUCT G2 PARTIAL (not 1.0).

Tool: `skills/creative-companion/scripts/remake_media_evidence_v026.py` (local FFmpeg/FFprobe).
Tests: `eval/test_remake_media_v026.py`.

- **15/15** locally executed Python unittest cases on generated codec frames (not real shooting footage).
- Proves: actual FFprobe timestamps, 320×180 decoded PNG, SHA-256 of input plus each sampled frame, AAC stream declared, no-audio declared as 0, altered file/frame hash causes error, 90 s execution limit, symlink/missing/corrupt input rejected.
- Does not prove: semantic video understanding, speaker/subject recognition, film quality, human approvals, runtime plugin invocation, real clip decoding, external access to the user's media.
- No real audiovisual user data was uploaded, modified or stored outside the temporary local test workspace.

External input preparation: Wikimedia Commons bench-tennis 2019 CC BY-SA 3.0 was identified as a possible *independent permissioned* test source. Network fetch was unavailable in this sandbox. Studio R2 `media.objekts.ai` has accessible published clip metadata; no bytes were decoded locally. **Never claim this was a successful real-video test.**

New product decision: G2 should have separate gates for `MEASURED_MEDIA` and `HOST_OBSERVED_FRAME`, with immutable source + PNG checksums and explicit provenance. A 100-image project must not be rejected because local video extractor samples up to 32 frames per media file.
