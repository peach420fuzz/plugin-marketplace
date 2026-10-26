# REMAKE public runtime changes

## 0.7.7-beta — SKRIPT information pages

Adds four SKRIPT pages on the existing Worker: `/skript/`, `/skript/support`, `/skript/privacy` and `/skript/terms`, with canonical GET/HEAD routes, navigable links, the existing studio image and bounded writing/host/data-handling descriptions. The privacy page names the existing Cloudflare request/security metadata, raw GitHub image and WebMCP C2PA delivery component; it does not import REMAKE MCP file-processing claims into SKRIPT. There is no SKRIPT upload, account, checkout, inference endpoint or automatic studio handoff.

Origin CSP/referrer policy, service settings, security, all nine other runtime modules, method0.39 and private REMAKE0.39/SKRIPT0.2 packages remain unchanged. New origin route/link/HEAD/CSP tests are separate from actual edge/browser and public-directory acceptance. This source change does not itself establish deployment or official publication.

## 0.7.6-beta — delivery privacy disclosure

The origin privacy copy previously made an unconditional no-scripts claim. A real public HTTP check observed Cloudflare adding its same-origin WebMCP bridge with only `data-packs="c2pa"` to delivered HTML. This patch distinguishes origin-generated markup from that delivery component, names the browser-local Content Credentials behavior and its image-host request implications, and avoids promising signature verification or browser execution. [Cloudflare describes the edge injection and pack](https://blog.cloudflare.com/webmcp/).

Only the Worker version/privacy response, MCP server version, and related in-memory compatibility regression change. Origin CSP remains exactly `script-src 'none'` within the existing full policy; referrer policy, tool behavior, guards, all nine other runtime modules, method 0.39.0 and private packages remain unchanged. This patch does not configure Cloudflare or change its existing pack selection.

This source proposal requires review and actual CI before merging. No deployment, browser-execution result, host acceptance, official catalog publication or G1–G10 completion is implied. Private REMAKE 0.39.0 and SKRIPT 0.2.0 distribution artifacts are frozen separately.
