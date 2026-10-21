# REMAKE by objekts — project state contract v0.23 (pre-1.0)

**This file supersedes earlier exported state shapes in `PROJECT_STATE_SCHEMA.md`, `PRODUCTION_PACKET_SCHEMA_v016.json` and the ad-hoc `packet_guard.py` format.** Those files remain only for history/migration and MUST NOT be used to export new projects. Canonical JSON Schema: `REMAKE_CANONICAL_PROJECT_SCHEMA_v023.json`. Independent standard-library checker/state engine: `../scripts/remake_packet_v023.py`.

## Product requirement

An input project can begin with **only an idea, no script or files**, or contain any count and mixture of actual reference files, a written screenplay, images, shotboards, video and sound. Host-upload size is not an artistic limit. Source IDs are stable; never fabricate an attachment or an observation. Never force 3 pictures, 3–5 shots, preassigned file roles or a studio handoff. For large batches record coverage rather than falsely claiming complete inspection.

Canonical minimal project (the CLI `create()` function produces the authoritative defaults):

```json
{
  "schema_version": "remake.project/0.23",
  "project_id": "creator-chosen-id",
  "revision": 1,
  "title": "",
  "author_intent": "",
  "materials": [],
  "locks": {},
  "decisions": [],
  "shots": [],
  "handoff": {"status": "NOT_SENT", "consent": false, "recipient": null, "delivery_receipt": null, "selected_material_ids": []},
  "migration": {"from": null, "warnings": []},
  "journal": []
}
```

## Data truth / provenance

`materials` records `id`, `kind`, `provenance`, `evidence`, `host_inspected` and optional description. Evidence vocabulary: `OBSERVED`, `USER_STATED`, `MODEL_HYPOTHESIS`, `UNKNOWN`. `host_inspected=true` is **a model/client claim, not cryptographic proof**: the independent real test must verify access to media. The public MCP inventory only receives text descriptors and cannot set actual perception evidence. An audio clip must not produce visual observations. For timecoded video, only quote a PTS from real file inspection or the host's verifiable media tool; not hypothetical durations.

`locks` is a key → exact value dictionary. `shots[].fields` provides exact comparable keys such as `camera` or `product`; `source_ids` may contain zero or more IDs from `materials`. Exact field mismatch is a strict error. Semantic drift (new actor face, changed crop, different hand, color etc.) still requires actual visual comparison by AI + human; deterministic tests are insufficient.

`decisions` and `shots` have explicit `status`: `PROPOSED`, `USER_APPROVED`, `LOCKED`, `REJECTED` or `SUPERSEDED`. Any `USER_APPROVED`/`LOCKED` record needs an `approval_ref` referencing a *real* author/host confirmation. A string alone does not prove the user agreed; the host must separately check. A rejected decision is not automatically reopened. Edits to approved shot cards require a new explicit author revision.

`handoff.status`: `NOT_SENT` by default, or `SENT_VERIFIED` only after the provider returned a real receipt and the author explicitly consented to the exact scope. Do not populate studio contact or automatically forward source materials. Imports of old project formats always reset transmission status and invalidate legacy visual inspection claims.

## Deterministic revision engine

`apply_delta(project,event)` is a pure function in `remake_packet_v023.py`; event fields: `event_id`, `expected_revision`, `kind`, `payload`, and, for lock set/remove or author approval/rejection only, `actor_claim:'USER'`, `approval_ref`. It uses optimistic revision matching, duplicate-event replay detection and an append-only journal. It never stores sessions between chats and cannot authenticate a human, even when a client supplies `actor_claim`. **Only a verified platform backend can establish identity.** Avoid updating or auto-approving any decision without such host evidence.

Supported event kinds: `material_add`, `shot_add`, `shot_field_set`, `lock_set`, `lock_remove`, `decision_propose`, `decision_approve`, `decision_reject`.

Commands when a local tool executor exists:

```
python skills/creative-companion/scripts/remake_packet_v023.py migrate legacy.json --output project-v023.json
python skills/creative-companion/scripts/remake_packet_v023.py validate project-v023.json
```

Optional offline video measurement (not automatically invoked in ChatGPT/Claude):

```
python skills/creative-companion/scripts/remake_video_evidence_v023.py consented-video.mp4 --out evidence/ --count 7
```

This helper uses local FFmpeg/FFprobe, SHA-256 and decoded frame PTS; sample frame PNGs are real extracted images, but it **does not interpret** people, scenes, emotion, camera movement or audio. User consent, platform upload policy, access to files and compute execution must be checked first.

## Version 1.0 blockers

This is a verified **core engineering increment** only. 1.0 requires real public auth and isolated project persistence + export/delete, platform use of project state instead of separate chat memory, real multimodal host tests and independently reviewed directing outcomes. Never claim the native private plugin executes these local scripts by itself. The public stateless MCP remains a separate, narrower service. Publication submissions and installs are not tests of creative quality.
