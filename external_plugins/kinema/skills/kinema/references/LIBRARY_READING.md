# KINEMA — library coverage and sampling

Applies to the local release candidate 0.4.2-rc.2. Query the actual host schema before using these fields. The separately hosted App may expose different tools and lacks this candidate's paging fields. A source package never establishes that its deployed counterpart was updated.

## Begin with the person's existing input

Use the specified platform and username or profile URL. A display name is a search lead until resolved. Do not construct an IMDb numeric user ID or a Kinopoisk ID from an ordinary name. IMDb has legacy `ur...` and newer `p....` profile routes. A film's page and a film-person's page do not identify a viewer. If identity remains ambiguous, ask for the direct profile link once; a file export stays optional.

For publicly accessible pages, follow the service's permitted access and the host's capabilities. Official feeds may supply recent observations; no universal film-service login or full-library API is included in this package. A failed read means that source is unavailable to this attempt. Do not replace it with guessed records. Never request credentials, session cookies or private tokens.

## Separate source coverage from the archive you inspected

Record collection, platform, capture date, access method, known public total when actually seen, imported count, inspected count, and whether the source is complete, partial or inaccessible. A cached page needs its own freshness limitation. Ratings, watched, watchlist, likes, diary and feedback are separate collections. Do not add counts that overlap as though they were distinct films.

Known rows can be paged completely while the external library remains incomplete. `hasMore: false` only ends the current known collection. `fullHistoryVerified` and external-completeness fields remain false for this local runtime. A profile pointer alone contains no viewing evidence.

## Inspect import results

Read received, accepted and rejected counts before summarizing an import. Rejected row indexes are zero-based and may be truncated to a bounded sample; do not silently present a partially accepted file as complete. Explicit invalid ratings and non-text title values cannot establish viewed films. Duplicate semantic CSV headings are rejected as ambiguous. A blank rating retains the existing unrated-observation behavior, so the source collection and user intention still matter. Do not retry malformed data unchanged or edit the original export to manufacture missing values.

## Read a balanced sample

Start with observed rating distribution and provenance. A maximum-rating-only import cannot justify claims about the viewer's average rating, disliked styles or entire taste spectrum. Read high, middle and low bands, explicit likes and written responses. Draw examples across dates, forms, countries and modes when accessible evidence supports those distinctions. Repeated entries for one film contribute chronology and rewatch context, not independent votes.

Aim for the main skill's 40–120 high-signal films when available. This is a working sampling target; report the actual number. With fewer examples, return fewer tentative facets. Do not fabricate a negative anchor to complete a rubric. A low relative rating can indicate weaker enthusiasm; an explicit dislike supplies stronger evidence. A rewatch may be research, disappointment or changed opinion.

The local `get_cinema_taste_dossier` can inspect normalized rating ranges using `historyMinRating` / `historyMaxRating` with `includeHistory: true`. Ratings in these parameters are on the normalized 0–10 scale. Inspect the returned `ratingEvidenceSummary`, which covers the observed archive, independently of the current filtered page. Unresolved rating conflicts and unrated films must not be silently converted into numeric preferences.

## Page without losing or double-counting records

Use moderate page sizes, for example `watchlistLimit: 100` and `historyLimit: 200`. Read `nextOffset` and `hasMore`; do not infer the next offset from a supposed fixed page size. Keep the returned `archiveSnapshot` and pass it as `expectedSnapshot` in subsequent calls within that archive session. If it changes, restart the read or explicitly mark the mixed-source result incomplete.

The snapshot is a content digest of one process's in-memory archive. It is not an access credential, a remote account version or a lock against another process writing the same file. Use one writer per archive. Do not store its value as proof of a film service's completeness.

The watchlist response separates imported membership, known intent, eligible pending films and returned page size. An explicit seen fact excludes an item from normal first-watch choices even when it remains in a watchlist. Hit/miss feedback alone does not prove viewing. Review provenance when feedback and imported records differ.

## Finalist verification

Check each exact candidate through available IDs, original title, verified translated aliases and year. Missing years do not license inventing a date. Conflicting stable IDs or established remake years require separate identities. A tool's research rejection does not prove that a candidate is unwatched.

Use three statuses independently for watched and watchlist: confirmed present; absent from a verified complete relevant source; unknown. Missing from this partial archive stays unknown. When the strongest source is incomplete, use one clear disclosure and label further picks accordingly. Do not burden every paragraph with the same caveat.

No personal library, profile handle, written review or private conversation may be copied into a public issue, test fixture or example without permission.

## Multiple local clients and ambiguous identities

The bundled local MCP uses a short-lived sibling file lock (`<configured archive>.lock`) around mutations and refreshes the latest stored archive for each request. This protects changes by separate clients using the **same** configured archive path on one filesystem. A stale lock after a process crash requires inspection before manual removal. A hash snapshot returned by read tools still protects pagination rather than synchronizing two independent devices. Use a distinct archive path for different people.

Title/year deduplication requires careful handling of records without stable IDs. When one title and year has conflicting IMDb/TMDB IDs, any identifier-free record stays an unresolved observation; do not assign it to one of the identified films. A candidate matching an old watched title without a year is an identity ambiguity rather than a confirmed viewing of a specific remake. The research assistant should ask or resolve the identity before recommending that exact candidate.
