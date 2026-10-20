# G2.2 acceptance matrix — v0.28

| Scenario | Pass criterion | Currently |
|---|---|---|
| Synthetic PNG via trusted URL stub | Correct dimensions/hash, no storage | PASS 14/14 combined safety suite |
| Spoofed URL, redirects, >12MiB, MIME mismatch | Explicit reject without forwarding bytes | PASS synthetic |
| Installed ChatGPT desktop image | actual `openai/fileParams` object reaches backend and SHA matches uploaded bytes | NOT RUN |
| Installed ChatGPT mobile image | same byte-hash match without `chat_upload` placeholder | NOT RUN |
| Host video | original hash may be computed; frame semantics/PTS only after separate decode | NOT RUN |
| Privacy | clear user-visible optional media-processing disclosure | deployed; reviewed text, not independent legal signoff |
| Director session | 8+ real turns, no invented media facts/LOCK regressions | NOT RUN |

The 14/14 selftests use synthetic PNG and stubbed download, NOT host execution. This is a transport prerequisite, not an AI vision or directing benchmark.
