# KINEMA by objekts · 0.4.2-rc.3

KINEMA supplies a local film-taste research engine for an AI assistant. It imports authorized observations, preserves ratings and feedback, keeps watched/watchlist/unknown exposure separate, and audits researched candidates. The assistant opens and verifies the factual sources. KINEMA does not supply a paid film database, a model subscription or universal account access.

This is a **portable release candidate**. Its Node subprocess and packaged launch paths were tested on macOS arm64 with Node 26.13.1. Claude Desktop, Gemini CLI and Grok Build installation, catalog acceptance and the separately hosted ChatGPT App are separate uncompleted checks.

## Included tools

| Tool | Operation |
|---|---|
| `connect_cinema_profile` | Store a public profile pointer; optionally request the specified Letterboxd recent RSS feed |
| `import_film_history` | Import authorized CSV text or explicit observations |
| `get_cinema_taste_dossier` | Read evidence, coverage, rating conflicts and paginated known history |
| `plan_deep_film_research` | Return a research protocol from observed evidence |
| `rank_researched_films` | Audit an externally researched candidate set |
| `save_film_verdict` | Persist explicitly authorized feedback |
| `delete_all_my_cinema_data` | Erase the active archive after explicit confirmation |

The server also advertises the MCP prompt `kinema_film_research`. Bundled research instructions are documentation; a desktop MCP bundle does not automatically install an assistant skill.

## Direct local MCP

Requires Node.js 22 or newer. No npm dependencies or build step.

```sh
node server/mcp-stdio.mjs
```

This process reads newline-delimited MCP messages on stdin. It does not print recommendations as a standalone command. A compatible host launches it with an absolute server path. For an isolated synthetic smoke test, the release-review scripts set `CINEMA42_DATA_FILE` to a temporary file. Do not add synthetic records to a real viewer archive.

## Claude Desktop candidate

Use the separate `kinema-by-objekts-0.4.2-rc.3.mcpb`. The manifest currently enables macOS. In Claude Desktop, follow Settings → Desktop app → Manage next to Extensions → Advanced settings → Install Extension…, then choose the bundle and review permissions. The older Settings layout has Extensions directly. This documented procedure has **not** been executed for this candidate.

The optional archive field accepts an absolute file path for one viewer. Empty uses the server's default file. Windows remains a release gate, including before the official directory submission; it is not enabled by this MCPB manifest.

## Gemini CLI candidate

The extension archive has `gemini-extension.json` at its root, with `GEMINI.md`, the server, and the existing research guide. After extracting to a local directory, the documented client command is:

```sh
gemini extensions install /absolute/path/to/kinema-by-objekts
gemini extensions list
```

Restart the CLI after installation. These are official documented commands, **not an executed installation**. No Gemini CLI was available in the release environment and the npm registry lookup failed with DNS `ENOTFOUND`.

The public gallery additionally requires a public GitHub repository with the `gemini-cli-extension` topic and this manifest at repository root. No repository or gallery entry was created by this package build.

## Grok Build candidate

The same payload includes `.grok-plugin/plugin.json`, `.mcp.json` and the original research guide. The MCP path uses the officially supported `${GROK_PLUGIN_ROOT}` substitution. The release review resolves that path and launches the extracted subprocess; it does not run Grok Build.

The official Grok catalog accepts a reviewed PR with a local vendor path or an exact commit-pinned remote source. A local-source catalog/index addition is prepared separately against the recorded upstream base. It has not been sent. No install command implying an accepted catalog entry is provided before the PR is merged.

## Storage, network and deletion

The default archive is `~/.local/share/objekts/cinema42.json`. Mutations use a bounded filesystem lock and atomic writes. Read-only calls refresh the archive. One archive belongs to one viewer; a second platform requires an explicit same-viewer merge flag. A stale lock requires inspection before manual recovery.

The local server contacts only the user-requested public Letterboxd RSS feed during that connection tool. Other supported profile links remain research pointers. There is no paid film/model API, telemetry, remote code download, shell-execution tool or third-party dependency. The selected AI host and its research tools have their own network activity and policies. Its assistant receives the evidence returned by tools.

`CINEMA42_DATA_FILE` selects a different file for direct local use. Gemini CLI sanitizes extension environments; arbitrary inherited environment overrides are not promised by this manifest. Use the documented default archive or a separately reviewed explicit client configuration for another viewer.

Deletion clears only the active local archive; host conversations, backups and external cinema-service records remain under their own controls. Read [PRIVACY.md](PRIVACY.md). Do not send passwords, cookies or tokens in chat or CSV fields.

## This candidate's change

The taste engine and three skill/reference files remain byte-identical to the reviewed RC2. The stdio adapter now returns JSON-RPC invalid-params errors for unknown tools and malformed argument containers, stays silent on notifications, and negotiates the two declared protocol versions `2025-11-25` and `2025-06-18`. Candidate metadata and the targeted version assertion were updated. Release-review evidence records the exact before/after checks; it is not a claim of complete protocol conformance or recommendation accuracy.

Created by [objekts](https://objekts.ai), a visual production studio creating films, images and visual worlds. Direction, AI production, VFX and animation — from first idea to final frame. Barcelona / Moscow / Worldwide. Support: salute@objekts.ai. [MIT license](LICENSE).
