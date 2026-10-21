# REMAKE by objekts

REMAKE helps turn ideas, scripts, reference images and rough cuts into concrete directing, editing, blocking and sound decisions. It works from any available material, including a text-only idea, and keeps author-approved choices separate from proposed changes.

This is beta 0.35.1, using the same Director Mode instructions as the existing REMAKE plugin and the public stateless MCP 0.7.2-beta. It is not release 1.0. No external professional quality certification or persistent authenticated accounts are claimed.

## Connection and privacy

The only remote service is `https://remake.objekts.ai/mcp`. The nine stateless tools support draft project JSON, validation and explicitly selected image/file handoffs. No API key is required. Files are sent only when selected and authorized by the creator; do not send secret URLs or tokens. The server does not decode video/audio, perform its own model inference, store projects, contact the studio or authenticate author approvals. The host model uses its own media capabilities and must distinguish inspected material from descriptions and proposals.

No hooks, shell execution, installation scripts or telemetry are included in this adapter. Optional reference documents are loaded only when relevant.

## Platforms

Claude/Grok: standard `.claude-plugin/plugin.json`, `.mcp.json`, and `skills/remake/`. Gemini CLI: `gemini-extension.json` and `GEMINI.md`. Installation or GitHub source availability is separate from official directory review and publication.

## Publisher and support

Published for objekts by the existing owner account `peach420fuzz`. The repository is a personal-account fork; no GitHub organization ownership is asserted. Product: https://remake.objekts.ai/ · Studio: https://objekts.ai/ · Support: https://remake.objekts.ai/support · Privacy: https://remake.objekts.ai/privacy · Terms: https://remake.objekts.ai/terms .

The existing MIT license is in `LICENSE`.

Optional local media-evidence helpers are included under `skills/remake/scripts/`. They are never run on installation; use them only for explicitly authorized local creator files when the host provides Python and FFmpeg. They do not supply server-side inference or grant media access.
