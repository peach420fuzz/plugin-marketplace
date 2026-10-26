# Recovered FAKE runtime

This is a recovery of the existing `fake-by-objekts` Cloudflare Worker, not a second engine. The owner's original development computer was lost. The complete deployed 0.4.7 JavaScript module and public Studio bundle were recovered on 26 October 2026. The original TypeScript project and its git history were not recovered.

`recovered/*.gz` are lossless baseline bundles, including their existing dependencies and license notices. `src/` holds the reviewed release changes. `build.mjs` verifies the baseline SHA-256 values and fails if a patch anchor changes. It emits the complete Worker and Studio modules without needing the lost machine or an npm dependency install.

```sh
node build.mjs
node --test tests/*.test.mjs
node --check dist/worker.mjs
node --input-type=module --check < dist/studio.js
```

Deployment retains the current static asset namespace (`keep_assets: true`), D1, R2, secrets, rate limiter and custom domain. The Worker overrides only Studio's main module and three new small modules. All original model binaries, face-fitting dependencies and download archives retain their existing URLs. No database migration or existing character rewrite is required.

Version 0.4.9 changes: live host capability negotiation; standard MCP Apps image transport plus legacy ChatGPT file transport; a real downloadable geometry/prompt fallback; one photographic portrait audition; a Russian/English UI selector; opt-in extended morphology for old projects and extended defaults for new projects; optional structured brief suggestions; project ownership validation for references; a reference-image size limit compatible with the MCP request limit; graceful WebGL startup errors.

Original project solvers v1/v2 remain unchanged. v3 raises semantic geometry strength by 1.8 before bounding each axis to [-1,1]. Fixed overrides remain fixed. Age/surface signals remain generation guidance, not newly invented GNM tissue simulation.

Native image generation remains the conversation host's operation. A transport unit test, QA-host file ID, HTTP health response or screenshot does not prove a real generated image, photographic quality or identity continuity. Public 1.0 review must include actual generation and explicit Master reuse in the intended hosts.

Baseline server SHA-256: `f86f9a171f4b76005fb94035c89bd4bcdcecd70918aad34d96eb407e9c4adbe5`.

Baseline Studio SHA-256: `d8634147fe7b75e4c15c5641ae30dd34d0ba0966d6f9ba1316390ac2a6d7a4b8`.
