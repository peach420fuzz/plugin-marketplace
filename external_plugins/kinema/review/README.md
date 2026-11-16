# KINEMA review fixture

These are real films with **fictional viewer ratings**, prepared for the hosted KINEMA MCP contract 0.2.1. They are not the owner's history, and are not a general taste-quality benchmark. The portable local runtime has a separate tool contract. This source checkpoint does not release, deploy, approve or publicly list an App.

Use only a dedicated disposable reviewer account whose owner has authorized test writes and deletion. Never import this fixture into a real viewer's archive.

1. Start with an empty dedicated account. Pass each `imports` entry from [RESEARCH_FIXTURE.json](RESEARCH_FIXTURE.json) to `add_film_observations`. Expected accepted counts are 4 and 1; ratings normalize to 10, 9, 6 and 2. Read the dossier: four rated/seen films, one known watchlist entry, partial external coverage.
2. Request the supplied `protocol`. It must preserve the requested count of one and require source research. Open the source pages in [RESEARCH_SOURCES.md](RESEARCH_SOURCES.md); separate catalog facts from the fixture's interpretive comparisons.
3. Pass `ranking` to `rank_researched_films`. Expect one selected film from the two eligible titles. Still Life must be rejected as already watched and Ossos for insufficient research. The tool validates evidence structure, not source truth. The selected film's viewing status remains unknown outside the partial history.
4. Save Good Morning (1959) as `seen`, then as `watchlist` for a planned rewatch. Read back the durable `userReportedSeen` exposure and later watchlist intent. Reranking must still exclude Good Morning. Rated count remains four; no rating is invented.
5. On explicit confirmation, delete only this disposable account's KINEMA data. Read back empty observations, profiles, explicit seen records and feedback. This does not delete ChatGPT conversations or provider backups.

The five stages passed against the production route, schema, store and Drizzle driver with an isolated SQLite D1-shaped adapter, without network requests. That result does not establish live D1 behavior, OAuth, a ChatGPT conversation, reviewer-account access or OpenAI review approval. Repeat the intended-host cases against the exact deployed version before using them as submission evidence.
