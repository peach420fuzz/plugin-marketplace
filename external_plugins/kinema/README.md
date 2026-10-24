# KINEMA by objekts

Free specialist film research for Grok Build and other skill-aware assistants. Created by [objekts](https://objekts.ai), a visual production studio creating films, images and visual worlds. Direction, AI production, VFX and animation — from first idea to final frame. Barcelona / Moscow / Worldwide.

## What it does

- Begins with a public Letterboxd, Kinopoisk, IMDb or MyShows username or profile link.
- Interprets actual ratings, low scores, likes and rewatches as multiple distinct taste directions.
- Researches a diverse 4× longlist with film institutions, credited interviews and original-language archives.
- Recommends a mix of verified personal-watchlist films and exploratory discoveries, with formal comparisons grounded in films the viewer rated.
- Uses reliable festival and cultural calendar references when relevant. Treats watched/watchlist absence as unknown when history is incomplete.

The skill uses the current AI assistant and any search facilities it already has. No external paid model or film-database API key is required.

## Data and scope

The bundled skill is instructions-only: it does not collect or persist user data. For local import, watchlist storage and ranking tools, the separate KINEMA MCPB/Gemini distributions include a Node.js MCP server. Its local store is `~/.local/share/objekts/cinema42.json` by default, with an explicit erase tool. If authorized, the tool contacts `https://letterboxd.com/{username}/rss/` for recent public activity. Film research requests to the host's own search tools follow that host's settings and policies. Never enter account passwords in prompts.

Source code and install instructions are maintained by objekts. Support: [contact objekts](https://objekts.ai/contact) or `salute@objekts.ai`.
