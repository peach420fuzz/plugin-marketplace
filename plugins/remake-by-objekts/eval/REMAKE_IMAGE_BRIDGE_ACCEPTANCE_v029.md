# G2.2b image bridge acceptance — 0.29, private

Status: **PARTIAL; engineering transport built, real AI-host test NOT RUN.**

- Server version: public MCP 0.4.0-beta.
- New tool: `remake_host_image_for_review`, actual MCP `ImageContent` (only PNG/JPEG), not a data URL or a text-only description.
- External live synthetic tests: 14/14 new; older 14+17+9 passed (54/54), no independent host attachment.
- Security: max 2 MiB inline, HTTPS oaiusercontent.com allowlist, no redirects, no SSRF to IP or arbitrary domain, 12MiB fetch threshold inherited, no server storage.
- Provenance: SHA256 source, source_id, no fabricated observations or timecodes.

### Pass criteria still missing

1. Actual ChatGPT-selected fileParam received in plugin-associated MCP tool call.
2. SHA256 end-to-end matches creator file; actual `image` block surfaced to model.
3. Model directly inspects frame image; independent reviewer checks two correct visual facts.
4. Multi-image and missing file/revoked file error path through a real host.
5. User data/privacy + cross-host compatibility + authenticated private projects separately validated.

No G3 director blind quality test, no G5 OAuth, no public release receipt.
