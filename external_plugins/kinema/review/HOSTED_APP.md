# KINEMA by objekts

KINEMA helps an AI assistant research personal film choices from ratings, viewing history, watchlists and explicit feedback. It keeps different interests, middling ratings and dislikes in view. The assistant researches film facts and formal connections; KINEMA checks the supplied evidence structure, filters known watched films and ranks qualifying candidates. A partial archive does not prove that an absent title is unseen.

Created by [objekts](https://objekts.ai), a visual production studio working across film, images, AI production, VFX and animation. This studio credit does not establish a verified legal publishing identity.

## Development status

This page documents the existing hosted KINEMA project and its review preparation. Candidate server 0.2.2 is saved as Site version 11, with source commit `3248afc2be8cb2af215369a4bbcb7220c0fd748d`. **Deployment, public directory approval and a submission-ready OpenAI draft are not established.** The existing private development connection has separate live-version and access state. This page is not an installation or public-access receipt.

## What the hosted App supports

- Save user-supplied film observations and explicit feedback in user-scoped server storage.
- Save supported profile pointers. Letterboxd may provide limited recent RSS records; a username is not a full-history import. IMDb, Kinopoisk and MyShows currently remain profile links until authorized integration is available.
- Read known evidence, watchlist coverage and uncertainty; request a research plan; audit and rank candidates supplied by the assistant.
- Preserve an explicit seen fact alongside a later planned rewatch. The prepared candidate reconciles dated rating changes and exposes unresolved contradictions.
- Delete the authenticated user's active KINEMA profile, observation and feedback records on explicit confirmation.

The App does not stream or deliver complete films, purchase tickets, process cards or obtain account passwords. Its ranker does not independently open or certify research URLs. Research depends on the host's permitted tools and access. The portable local runtime uses a separate storage mode and tool contract.

## Support

For help with KINEMA, contact [salute@objekts.ai](mailto:salute@objekts.ai). Describe the problem and the version or environment. Do not send passwords, card details or unnecessary private viewing exports.

To remove active KINEMA records, use its supported deletion workflow from the authenticated account and confirm the request. This does not erase ChatGPT conversations, source-service accounts, other viewers or provider backups. Do not treat an email alone as a completed deletion receipt.

## Data and review information

The hosted App stores connected profile handles and URLs, imported film observations, ratings where supplied, source/timing information and explicit feedback under the authenticated user's identifier. Browser imports pass canonical film fields rather than arbitrary CSV review/email/note columns in the prepared candidate. The host assistant and hosting providers may process requests and tool results. No local-only, no-logging or no-backup-retention promise is made here.

This is product/support information, **not published service terms or a completed privacy policy**. Those documents, the verified publisher, reviewer access and final candidate walkthrough must be completed before submission. The [fictional-rating fixture](RESEARCH_FIXTURE.json), [source map](RESEARCH_SOURCES.md) and [isolated expected results](EXPECTED_RESULTS.json) are technical QA materials, not OpenAI review approval or a real viewer profile.
