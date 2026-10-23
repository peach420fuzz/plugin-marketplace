# REMAKE public review contract, 0.35.1

## Correct tool-level examples

The stateless create tool returns a caller-owned `remake.project/0.23` object at revision1. Apply one supported draft event at a time, using the revision returned by the prior event. Add a PROPOSED shot with `shot_add`, then change its `fields.camera` with `shot_field_set`, then validate the exact returned project. The public boundary never approves or unlocks a shot. A `title_set` event is unsupported.

The legacy portable packet returns `approvals: UNVERIFIED`, `studio_handoff: NOT_REQUESTED`, and `sent: false`. It does not return the canonical project's `handoff` object. Review expectations must match the actual tool, not an aspirational schema.

Exact named camera/sound conflicts, contradictory normalized LOCK keys and duplicate shot IDs are rejected during compilation. These checks do not perform semantic visual continuity assessment or verify who wrote a lock.

## Evidence limits

Tool-level rehearsals use synthetic text fixtures and actual runtime calls. They do not establish saved OpenAI-host routing, file handoff, a recorded intended-host demo, user consent, professional blind quality or directory approval. A review demo must show real host interactions. No private ACT/PACK frames may be published merely to fill a review fixture slot.
