# 2026-10-28 candidate package audit

The canonical source and review cases were updated after the older 0.4.9 ZIPs were checked in. Rebuild with `python3 build-packages.py` before running `python3 check-packages.py`. The archive audit in `package-audit.json` describes the newly rebuilt local candidates, not the older committed ZIPs or an installed host. The existing Worker archive redirect remains pinned to the older commit and is not advertised as this source candidate.

OpenAI candidate SHA256: cad87c6362ef832c3d2d614d88b6cacc4ed143565e59acaf6cbf944624910bd2. Build is deterministic from this source. All five archive checks passed. 19 local runtime tests passed; all eight MCP tools have boolean readOnlyHint, openWorldHint and destructiveHint annotations.

Real production remains 0.4.7, the private plugin remains 0.4.8. Candidate runtime 0.4.9 is not ready for public review: deployed stage behavior after the last patch, actual target-host generation and Master reuse, current-version video and saved OpenAI portal identity/draft remain unverified. No final review submission was performed. Cloudflare observability query on 2026-10-28 returned no staged events; absent events do not prove absence of errors.
