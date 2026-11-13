# KINEMA by objekts — 0.4.2-rc.2

**Local review candidate.** This package is not a public catalog release and does not replace the existing hosted ChatGPT App. It continues the existing KINEMA source at public base `1237da26f3844b99a34b01056beea7fb168213fa`, including the previously reviewed feedback/alias patch.

KINEMA helps an AI assistant research films from actual ratings, likes, dislikes, viewing history and watchlists. It preserves multiple interests, checks known exposure and asks the host to verify film facts, comparisons and calendar context through available sources. A public nickname is a starting point; private or ambiguous accounts may need a direct profile link. Exports are optional. No paid external model or film-database API is required by the package. The host service can have its own usage charges.

## Candidate changes

- Feedback and watchlist share one evidence view. Explicit seen facts survive subsequent preference changes. Recommendation reactions alone do not fabricate viewing or ratings.
- Verified original-title aliases match incomplete older records while conflicting IDs and remake years remain separate.
- Known watchlist/history pages expose offsets, continuation and a snapshot guard. Filter observed history by normalized rating bands. External completeness stays unverified.
- Qualified taste facets receive coverage before normal diversity reranking. Negative relations are not force-selected to fill a facet. Narrow requests can disable that preference.
- Platform routes distinguish film/person pages from viewer profiles, support actual IMDb profile forms and MyShows root handles, and preserve unresolved display names without a false saved connection.
- Import rejects non-text titles and explicitly invalid ratings, reports rejected row indexes, and refuses ambiguous duplicate CSV headings.
- Bundled reading and writing guides require source-level factual checks and explicit keep/revise/drop decisions.

## Local use

Node.js22 or newer; no npm dependency installation is required.

```sh
node server/mcp-stdio.mjs
```

That command is an MCP stdio process, not an interactive recommendation command. Configure it in a compatible MCP host with an absolute path. Local data defaults to `~/.local/share/objekts/cinema42.json`. Set `CINEMA42_DATA_FILE` to a distinct file for another viewer. Local MCP clients use a bounded filesystem lock for archive mutations, reload the latest stored state before every call and write updates atomically. A stale lock fails closed and requires deliberate inspection before recovery.

The separately built `.mcpb` contains the same Node server and approved square icon. The Gemini CLI archive contains its root manifest, GEMINI.md, server and skill. Client-specific installation and official gallery acceptance must be verified independently. There is no new ChatGPT skills-only submission claim, remote OAuth service, Alice voice webhook or universal auto-login connector in this candidate.

## Tests and review

```sh
node --test tests/*.test.mjs
```

Use the supplied independent Python transport harness for initialized JSON-RPC, tool-schema validation and isolated positive/negative operations. It uses Python3.10+ and jsonschema. Tests use synthetic temporary archives. They establish local behavior, not personal recommendation accuracy, Apple Silicon execution or installed Claude/Gemini acceptance.

The review archive retains source hashes, before/after checks, a clean patch replay, package-level runs and a source-qualified quality rubric. No personal library is bundled. Existing private ChatGPT skill1.2.1 and the public repository remain unchanged by this archive.

## Data and studio

Read [PRIVACY.md](PRIVACY.md). The local server has no automatic expiry. Selected evidence is returned to the connected AI host; local storage does not prevent host processing. Erasing the active archive does not erase host conversations or backups.

Created by [objekts](https://objekts.ai), a visual production studio creating films, images and visual worlds. Direction, AI production, VFX and animation — from first idea to final frame. Barcelona / Moscow / Worldwide. Support: salute@objekts.ai. [MIT license](LICENSE).

## 0.4.2-rc.2 source improvements (13 November 2026)

- Reject conflation of different films that share a title/year but have contradictory stable IMDb or TMDB IDs; keep unkeyed collisions separately flagged.
- Classify a same-title possible viewing with unknown release year as an identity question, and avoid asserting it was definitely watched.
- Keep local shared archive mutations atomic between simultaneous installed clients through a short-held filesystem lock. Read-only tools refresh persisted state, and stale continuation cursors are rejected. Stale `.lock` recovery is a manual, inspect-before-removal operation.
- Reject non-text candidate titles as identities; preserve previous feedback, account, import and paginated library checks.

This release is a draft code candidate. No deployed ChatGPT App, Claude desktop client, Gemini Gallery or Alice voice skill is implied by the version field. The user provides an approved connected account or permitted viewing evidence; profile coverage is declared explicitly.

## Identity and multi-platform safeguards

When multiple cinema-service accounts are connected to one archive, confirm that both accounts belong to the same viewer. `mergeWithExistingViewer: true` is the explicitly user-authorized merge flag in `connect_cinema_profile` and `import_film_history`; mismatched handles on the same platform still require separate archives. Release-year values explicitly supplied in a history file or feedback must be within the supported film-year range. Unknown-year reactions remain ambiguous when different films or remakes could share a title. A negative reaction can conservatively suppress a single plausible high-rated anchor without creating a fabricated watched or numeric-rating observation.
