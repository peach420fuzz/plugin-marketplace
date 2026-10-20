# REMAKE G2.2 — ChatGPT host fileParam preflight v0.28

Status: **public MCP deployed, synthetic tested; native ChatGPT attached-file invocation NOT VERIFIED.**

## Contract

Tool: `remake_host_file_preflight`. ChatGPT-specific `_meta["openai/fileParams"] = ["file"]`. The top-level `file` input is a file object with **required** `download_url` and `file_id`; **optional but declared** `mime_type`, `file_name`. Another input `source_id` is a user/model-chosen stable non-secret ID. There is no fixed maximum number of project source references; preflight is per call and has an explicit 12MiB byte limit.

The MCP worker accepts only HTTPS hostnames in `*.oaiusercontent.com` or `files.oaiusercontent.com` and forbids HTTP redirects and oversized responses. PNG dimensions from IHDR; JPEG SOF dimensions; WebP signature; MP4 ftyp signature without fabricated frame count, PTS or duration. Computes a source SHA256 from the **actual bytes it temporarily received**. No byte storage and no default forwarding to studio.

The returned `schema = remake.host_file_evidence/0.28` exposes source/file ID, SHA256, length, limited media descriptors, `model_saw_pixels=false`, `visual_semantics=NOT_ANALYZED`, `frame_pts=[]`, `approval_status=UNVERIFIED`, `stored=false`. Do not promote these states to observed cinematic truths or human approval. For a model to actually observe frames, a host-native visual context or authorized vision backend must inspect real frames. No assumption that image MCP tool response blocks become ChatGPT model-visible visual input.

If fileParams are absent or broken, fail explicitly. **Do not** request manual upload of all user files or fix media count at 2, 3 or 7. A project may begin from a one-sentence idea, script, images, video, audio or mixed references; each medium is processed only where host capabilities actually allow.

## Runtime security and privacy

Untrusted URLs are rejected, no redirects followed; stream size is capped at 12MiB. The file-ref URL does not appear in tool results or app logs. Tool outputs reveal only filename-independent hashes, IDs and measurements to the host. This feature is explicitly described at `https://remake.objekts.ai/privacy`; the host may separately retain conversation/tool traces under its own terms. No rights/ownership claims are inferred from file access.

## Tests and scope

Cloudflare externally read selftests: `/_file_selftest` 14/14; `/_core_selftest` 17/17; `/_selftest` 9/9. Source `plugins/remake-by-objekts/host-file-v028.mjs`. **Synthetic responses only**; no authenticated host fileParam actually transferred. This distinction is fatal for labeling G2.2 as PASS.

## Required end-to-end test

In a legitimate connected host, select an authorized image; verify MCP request includes object `file.download_url` and `file.file_id`; verify actual byte size/hash against independent local file; verify MIME / dimensions; verify non-ChatGPT file source rejection; confirm media is never cached and irrelevant confidential files remain untransmitted. Repeat on mobile, desktop, Firefox/Safari/Chrome where possible. Only then G2.2 initial host transport can pass; visual content and PTS require separate perception tests.
