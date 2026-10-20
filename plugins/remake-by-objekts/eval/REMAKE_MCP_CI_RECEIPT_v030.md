# REMAKE 0.30 Engineering receipt — 19 October 2026

- Public Cloudflare Worker `objekts-remake-public`, version `0.5.0-beta` (same public address and eight MCP tools).
- GitHub source commits: image integrity `1b143a46844d4689fa6258506d54fd7586e7971e`; image fixture/tests `26ed95a94caf368b4e7197698a303a3a2d065ccf`; private diagnostic guard `7d5a38583470761ee4bc24a74ac1369d045d7e99`.
- Live synthetic 19/19+14/14+17/17+9/9 = 59/59. Confirmed before diagnostic endpoints were protected.
- GitHub Actions `REMAKE MCP integration` SUCCESS https://github.com/peach420fuzz/plugin-marketplace/actions/runs/39213968454 . 13/13 real handler-level in-memory assertions with synthetic file URL + CRC-correct PNG.
- HTTP external: `/health` responds 200; public `/_image_selftest` returns 404.
- Real Library media: two private image contact sheets verified locally by Pillow and full PNG CRC (28+20 chunks). This is NOT actual ChatGPT fileParams or independent film-quality evaluation.
- No public OpenAI store submission. No 1.0 claim.
