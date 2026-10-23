# REMAKE by objekts — 0.20 private release gate

This file describes **claims the shipped product may and may not make**.

## P0 release blockers

1. **Original icon:** supply approved original objekts v37 asset, verify exact source and visual hash. Do not invent geometry. Set valid package-relative `logo` and `composerIcon` paths and inspect both ChatGPT and Codex presentation.
2. **Real installed user session:** verify multiple turns in actual supported host with *seen images*, character/product/camera LOCK and minimal-delta revisions. Rehearsal transcripts are not actual independent sessions.
3. **Creator value:** at least six rights-cleared independent creator projects, two blinded creative reviewers comparing identical prompts against default assistant; register raw responses, no success declaration from structural tests.
4. **Correct export:** preserving author intent, exact observed/source truth, approvals, immutable constraints, rejected edits, provenance, rights uncertainty and `handoff.NOT_SENT`.
5. **Privacy/policy:** public plugin cannot be primarily an advertisement, sell digital services or have hidden data capture. Publisher credit is factual. User must get complete useful work without any objekts contact.
6. **Claims:** no automatic MP4 semantic comprehension, audio/video analysis, human review, lead delivery, background memory or conversion metrics until actual runtime exists and is evaluated.
7. **Brand:** REMAKE is used by other visual-software businesses; naming/trademark check and directory uniqueness are independent gates.

## Static packet checker

`skills/creative-companion/scripts/packet_guard.py` checks well-formed declared JSON project packets for duplicate/unresolved asset and shot IDs, `OBSERVED` claims without pixels, unverified `USER_APPROVED`, obvious project lock conflicts, unsupported status and falsely reported sending. It cannot understand the source script, compare pixel identity, enforce all semantic locks, or distinguish actual user approval from a forged reference. It is an **offline optional utility**, not a plugin runtime tool.

Local use:

```sh
python3 skills/creative-companion/scripts/packet_guard.py example_packet.json
```

Exit codes: 0 static checks pass; 1 errors; 2 unreadable/invalid JSON. Zero warnings are not required (deliberate stillness and open sound may be valid creative choices).

## External staging

The separate Cloudflare Worker `objekts-creative-companion-staging` has D1 and a gated MCP endpoint. This installer does NOT register that endpoint or its secrets. Do not expose its staging gate as a public API token or silently replace the existing production MCP. A future accountable connection requires deliberate auth and current client configuration, end-to-end token/isolation tests, accurate privacy controls, and a reviewed public release.
