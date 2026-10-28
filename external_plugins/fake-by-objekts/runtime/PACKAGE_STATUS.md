# FAKE 0.4.9 — 2026-10-28 package and deployment evidence

All five candidate ZIPs were regenerated from this source and their actual contents passed `python3 check-packages.py`. OpenAI's existing Portal package has a distinct historical name and MCP key: `fake-by-objekts-chatgpt`, endpoint `https://fake.objekts.ai/mcp/chatgpt`. The OpenAI build preserves these. Other client packages retain their own existing portable identity. The server supports both MCP routes.

OpenAI uploaded ZIP SHA256: ac54659bcc931fd73fa7567c7cc4bd8f0533a88b1d4e5599ec84e0c0721373bf. The saved draft was downloaded again: all 11 member files are byte-identical; the exported container SHA differs because the Portal repackages ZIP entries. The correct 1254px square logo is present. The Portal header still displays the legacy pink app image; this is not confirmed replaced by package readback.

Production Worker 0.4.9 was uploaded with the exact locally tested code, retaining production D1, R2, static assets, domain secret and write limiter. Narrow worker-first routes cover the patched Studio modules. 20 local tests pass. OpenAI discovered all eight tools after production deployment; latest MCP scan reported no findings. Bundled skill scan passed. Name/description automated checking returned a non-blocking incomplete-check result, not a policy pass or rejection.

The existing OpenAI plugin contains a saved 0.4.9 draft, correct publisher/category/four URLs, Russian translation and 5 positive/3 negative case definitions. Review information was saved. Cases are not certified as run, the inherited demo has not been verified for this runtime, actual host generation/Master reuse remains unverified, and no review submission or publication occurred. Do not label this a verified 1.0 or a public listing on all hosts.

The immutable artifact commit is pinned separately by runtime/download-ref.txt before updating production archive redirects. Rebuild with `python3 build-packages.py`, audit with `python3 check-packages.py`.
