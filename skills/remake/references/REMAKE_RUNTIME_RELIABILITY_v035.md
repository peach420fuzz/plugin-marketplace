# Runtime reliability 0.35 — private engineering update

The full 86-file 0.34 Plugin Creator release was exported before editing. Its
original SHA256 is recorded in package-files.json; an overlay is not a backup.

The original full release's Python suite failed 5/97 cases with the current
FFmpeg: `-vsync` is not recognized. The local media helper now uses
`-fps_mode passthrough`. A regression compares selected PNG pixels against a
separate full sequential raw RGB decode, binds frame index/PTS, reloads the
manifest and verifies source/frame hashes. These are synthetic decoder tests,
not a real-host or professional directing assessment.

The public and staging HTTP routes now limit actual streamed request bytes before
allocating a complete body, reject malformed lengths and invalid UTF-8, cancel
oversized/stalled input and do not echo raw transport errors. The closed account
draft route now uses the same conservative draft guard as the public route;
PROPOSED plus a fake approval field and edits to REJECTED shots are rejected.
No real OIDC provider or authenticated approval UI was enabled.

The complete package is reproducibly built from an explicit source inventory.
CI runs the full Python suite and the image/frame identity regression, MCP
dispatcher, approval abuse and stream bounds checks. None measures film quality.

Actual ChatGPT fileParams, eight genuine author turns, two blind professional
reviewers, G5 real identities, original brand authority and official publication
remain separate required acceptance. Version 1.0 remains blocked.
