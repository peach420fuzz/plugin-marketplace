# KINEMA by objekts

Free personal cinema research for skill-aware AI assistants. Start with a Letterboxd, Kinopoisk, IMDb or MyShows username/profile link, or your own film list. The assistant studies actual ratings, likes, dislikes and reviews, maps different interests, researches candidates, and explains watchlist picks and further discoveries through film form and verified sources.

History coverage is stated explicitly. A recent feed is a sample; a title missing from it has unknown watched/watchlist status. The assistant checks finalists individually where permitted access allows. KINEMA requires the host's research capabilities for source verification. No paid external model or movie API key is required by the package. The host service may have its own subscription or usage charges.

## Install

### ChatGPT

The public-upload package is skills-only and uses the host's permitted research/file tools. Public directory review and approval are separate from source publication. The existing private development plugin has its own App identity; do not create duplicate private plugins while submitting an update.

### Claude / Cowork / Claude Code

This folder includes `.claude-plugin/plugin.json` and `skills/kinema/SKILL.md`. Submit the GitHub repository `peach420fuzz/plugin-marketplace`, branch `main`, plugin path `external_plugins/kinema` through the Claude directory portal. Directory approval is required for an official listing. For local imports and evidence auditing, a separate MCPB bundle includes the Node.js server.

### Gemini CLI

A self-contained extension release branch places `gemini-extension.json` at its root:

```sh
gemini extensions install https://github.com/peach420fuzz/plugin-marketplace --ref kinema-gemini-v0.4.0
```

Restart the client after installation. This is direct source installation. Gallery inclusion requires Google's discovery and validation process; it is not claimed here.

### Other local MCP clients

With Node.js 22 or newer, configure a stdio MCP server using `node /absolute/path/to/server/mcp-stdio.mjs`. For a different viewer set a distinct `CINEMA42_DATA_FILE`. The server exposes seven tools for profile pointers/recent RSS, imports, dossiers, research planning, candidate auditing, feedback and scoped deletion. It does not generate recommendations autonomously or verify source pages.

The portable skill can guide other assistants that accept user instructions, subject to their actual tool support. A local MCP bundle does not automatically create a voice skill for Alice or a public listing in any service.

## Development

```sh
node --test tests/*.test.mjs
```

The version 0.4.0 release fixes rating changes, contradictory ratings, negative rewatches, localized-title matching, duplicate evidence scoring and calendar-date validation. Tests check deterministic behavior. Personal recommendation quality still needs real-viewer evaluation; no accuracy percentage is claimed.

## Support

Contact [objekts](https://objekts.ai/contact) or salute@objekts.ai. Provide redacted data only. [Privacy and data handling](PRIVACY.md). [MIT license and usage terms](LICENSE).

## Studio

Created by [objekts](https://objekts.ai), a visual production studio creating films, images and visual worlds. Direction, AI production, VFX and animation — from first idea to final frame. Barcelona / Moscow / Worldwide. [Work and studio](https://objekts.ai) · [Contact](https://objekts.ai/contact).
