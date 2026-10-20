# REMAKE 0.31 test receipt — synthetic multi-file MCP

- Worker: `objekts-remake-public`; public MCP server `0.6.0-beta` with 9 tools.
- Endpoint: `https://remake.objekts.ai/mcp`; new tool `remake_host_image_batch`.
- Source: `plugins/remake-by-objekts/image-batch-v031.mjs`; checks under GitHub Actions `plugins/remake-by-objekts/tests/mcp-integration-v030.mjs`.
- Live synthetic coverage includes 1, 2, 7 and 8 files per call, rejection of 9 in one invocation, duplicate source IDs, duplicate host file IDs, corrupted later file and preserving SHA256 mapping. Per-call batch 1–8; unlimited project asset count across calls.
- Prior image, file preflight, canonical and descriptor suites retained.
- **NOT PROVEN:** real ChatGPT fileParams binding or image being seen by host model; independent artistic directorial evaluation, OAuth memory, original brand artwork, public listing.
