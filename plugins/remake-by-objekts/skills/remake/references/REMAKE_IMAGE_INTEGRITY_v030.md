# REMAKE image integrity 0.30 (19 October 2026)

## What changed

A critical incorrect assumption was uncovered: the previous embedded 1×1 PNG test image had a corrupted IDAT chunk CRC, yet tests passed because server only checked PNG signature and IHDR dimensions. New `image-integrity-v030.mjs` verifies every PNG chunk CRC and ensures IHDR, IDAT, IEND, bounded dimensions, no truncated chunks or trailing data. JPEG support verifies the SOI, SOF, SOS, EOI marker envelope and image dimensions. The server rejects malformed media before embedding it as MCP ImageContent. **Container integrity is still not full pixel decoding.**

Current production MCP Worker: `0.5.0-beta`, source at `https://github.com/peach420fuzz/plugin-marketplace/tree/main/plugins/remake-by-objekts`. The private skill `0.30.0` provides instructions to call those tools but cannot itself guarantee host access, AI visual perception, external identity or persistence. Source count is arbitrary; server media caps apply only per call.

## Tested boundaries

- Previously faulty IDAT CRC fixture rejected. Replaced by correctly checksummed RGBA 1×1 synthetic PNG.
- Malformed IDAT CRC, corrupt IHDR CRC, truncation, appended bytes, fake JPEG, malicious host and media size limits rejected.
- Live Worker pre-publish checks: 19/19 image bridge, 14/14 file preflight, 17/17 revision engine, 9/9 legacy tools = 59/59 synthetic tests PASS.
- GitHub Actions integration: 13/13 assertions across JSON-RPC dispatcher, content, rejection and protected diagnostic suites PASS, run https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39213968454. Local CI uses fake signed host URL/fetch stub — NOT a real ChatGPT tool selection.
- Real private film-derived PNG contact sheets passed independent Pillow verify + 48 total PNG chunk CRCs across 2 files (28 and 20). Customer files were not committed. This is independent local media byte evidence; no hosted inference.
- All publicly callable selftest routes now return 404 without `REMAKE_DIAGNOSTIC_TOKEN`; CI can run them in-memory. Public `/health` still responds.

## Formal open gates

G2.2: One real ChatGPT plugin call with `openai/fileParams` from authorized user, record actual file ID and SHA agreement, verify model receives and visually inspects real image; test 0,1,2,7+ references. Demonstrate video frame extraction with native PTS. G3: 20 authentic ≥8-turn directing sessions, two independent blind professional reviewers. G5: real OAuth user identity. G8: original approved v37 logo. G10: official store approval.
