# REMAKE v0.31 — multi-source image transport acceptance

## Product contract

- A project may contain any number or mix of images, videos, texts, scripts, audio, ideas, or a storyboard. Zero images is a first-class valid input.
- `remake_host_image_batch` uses ChatGPT `openai/fileParams` with a top-level `files` array. Pass `source_ids` matching `files` in order, or default to host-provided `file_id`. Preserve immutable mapping of `source_id`, `file_id`, source SHA256 and image content.
- A single MCP call is bounded to 1–8 images, 2 MiB per inline PNG/JPEG and 8 MiB total. These are transport limits, never a ceiling on reference count in a project. Additional calls are allowed. If a batch fails, do not claim partial observations from it.
- Files are fetched only from permitted HTTPS host-file URLs, with no redirects. Server-side PNG/JPEG envelope checks do not prove full pixel decode, image truth, human authorship or rights.
- Every image returns separately tagged `type:image` content; source hashing is done in transit. The server does not run image AI, FFmpeg or save source media. The host may process/retain image content according to its own policies.

## Real versus simulated acceptance

- GitHub Actions run (MCP integration) validates actual dispatcher routes and 1/2/7 source synthetic PNG arrays, ID mapping, duplicate rejection and prior tool regression. Test URLs are mocks, not ChatGPT users.
- To pass G2.2, run one independent ChatGPT host attachment invocation, compare source SHA256 to response, verify visible host image observation and test multi-attachment 2 and 7, errors and mobile/desktop where supported. No such installed-host receipt yet.
- G3 remains blocked on actual 8-turn directing sessions and two independent evaluators.
