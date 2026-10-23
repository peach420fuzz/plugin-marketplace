# REMAKE 0.29 — MCP image pixels, not synthetic film perception

## Verified implementation

- Source module: `https://github.com/peach420fuzz/plugin-marketplace/blob/main/plugins/remake-by-objekts/image-review-v029.mjs`
- Live endpoint `https://remake.objekts.ai/mcp`, tool `remake_host_image_for_review`, OpenAI `fileParams` for selected `file`
- Input formats: PNG/JPEG only, ≤2MiB per call, dimension header ≤4096×4096; no fixed count of creative references; image tool called once per desired asset
- Result: MCP `content[0]` structured provenance text, `content[1]` image block with `mimeType` and base64 actual image bytes, `structuredContent` SHA256, source ID, declared host observation `UNVERIFIED`
- No server-side visual semantics, audio, video PTS or frame extraction; all creative descriptions must come from model inspection of actual visual host context or named human observation
- No application database storage, marketing leads or transfers to objekts; returned pixels enter host conversation and host's own retention policy
- Live synthetic test: 14/14 image bridge, 14/14 preflight, 17/17 canonical engine, 9/9 old tools = 54/54; *no real ChatGPT fileParams invocation yet*

## Required real host pilot

1. In a host with REMAKE actually connected, user selects **one** permissioned PNG/JPEG, explicitly permits analysis.
2. Tool must be invoked through fileParams with actual plugin authorized URL. Capture redacted call receipt with file ID, result SHA256, MIME, dimensions, model image block presence; never log signed URL or content bytes.
3. Independently compare SHA256 of the user-selected original to tool `source_sha256`.
4. Ask model to identify two indisputable visual facts from the actual image, and one **PROPOSED** directing interpretation. Two independent humans confirm what image shows; model claims must cite source ID and hash.
5. Repeat with two images, JPEG, unreadable/expired URL, >2MiB, a non-image file, then desktop/mobile host if available.
6. Confirm no media persisted by REMAKE server. Log failure cases; do not treat source file name, bytes-only hash or result object as evidence of observed scene.

Blocker: the current assistant conversation has no direct invocation of the private REMAKE plugin; **the hosted end-to-end pipeline has not been independently run**. G2.2 remains PARTIAL. Do not promote 0.29 to 1.0.
