# KINEMA by objekts — Gemini CLI extension

KINEMA is a free personal film-research extension for Gemini CLI. It works from a public Letterboxd, Kinopoisk, IMDb or MyShows username, or a user-supplied viewing-history export. It identifies several independent tastes, compares them to source-verified cinema history and proposes a mix of watchlist picks and discoveries. It checks the calendar for relevant festivals and historical awards. Imported local data can be erased explicitly. Research uses Gemini's own available capabilities. No paid external model or movie API key.

**Creator:** objekts — a visual production studio creating films, images and visual worlds. Direction, AI production, VFX and animation — from first idea to final frame. Barcelona / Moscow / Worldwide. https://objekts.ai

**Install:** `gemini extensions install https://github.com/peach420fuzz/plugin-marketplace --ref kinema-gemini-v0.3.3`. Restart Gemini CLI and ask for film recommendations by public profile. Node.js 22+ required for the bundled local MCP tools. This branch contains only the KINEMA extension source; it is intended as a stand-alone distributable extension. Gallery indexing requires a dedicated public repository with the `gemini-cli-extension` topic and a root manifest.

**Data:** The local extension writes `~/.local/share/objekts/cinema42.json` with restrictive permissions; it fetches a recent public RSS sample from Letterboxd for connected Letterboxd profiles. No account passwords are needed. Use the `delete_all_my_cinema_data` MCP tool on explicit request. Source license: MIT. Support: salute@objekts.ai.
