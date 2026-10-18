# Director's Project State and handoff contract v0.4

This is a data *contract* for a portable user-controlled brief, not a claim that the current chat maintains an independent permanent database. The companion may derive an in-chat state; the user can request an explicit Markdown/JSON export. No automatic gathering of earlier chats, hidden files, contacts or unconsented attachments.

## Required document structure

- `schema_version`: `0.3.0`
- `project_id`: local ID chosen within session (not secret, not a CRM receipt)
- `title`, `kind`, `owner_goal`, `audience`, `channel`, `duration_seconds`: user statements or null, never fabricated
- `premise`, `approved_script`, `treatment`, `visual_world`: content annotated with provenance and approval
- `sources`: each user-supplied file/link with `id`, `name`, `kind`, `provenance`, `rights_known`, `handoff_allowed` (false by default), `authority_domains` (explicitly set)
- `locks`: immutable elements: domain, value, origin, affected stages
- `decisions`: dated if date known; `status=PROPOSED|APPROVED|REJECTED`; rationale, owner, supersedes and delta
- `departments`: by ID `01`–`15`: status `ESTABLISHED|DRAFT|MISSING|NOT_APPLICABLE`, source evidence, actual outstanding decision, output links
- `unknowns`: necessary information explicitly missing; avoid question spam
- `production`: route, constraints, minimum PoC, source-footage prerequisites outside studio scope, deliverable versions
- `handoff`: opt-in only; recipient only `objekts` when user selected it; reply channel; intent to request further work; permitted material IDs; human-review request; explicit preview and confirm flags

## Privacy and action gates

1. **Analysis:** read only the material that the user provided in this permitted context. No contact requirement.
2. **Export:** give person a portable document independent of studio engagement; branding credit voluntary.
3. **Preview:** after user requests objekts human help, prepare a concise packet. No outbound side effects.
4. **Consent:** show exact recipient, intended files, contact channel, purpose, and any known limits. Ask for explicit confirmation to send the shown version.
5. **Submission:** use the actual `submit_production_brief` tool **only** if connected, permitted and user has confirmed. Schema must be read from tool, not inferred from this text.
6. **Receipt:** report actual response, not a fabricated ID. If unavailable, say not sent.
7. **Confidentiality:** `handoff_allowed` is separate from `rights_known`; permission to discuss a reference does not equal permission to transmit it.

## Editable document example

See `examples/tropical-shift-project.json` in the plugin root. All example content is fictional, not a real client brief.

## Consent fingerprint v0.3

A local consent fingerprint is the SHA-256 of the **current transfer snapshot** plus preview. The transfer snapshot includes actual script, goal, treatment, all decisions, all LOCK values, unresolved questions, production scope, contact and permitted source metadata—not merely the visible preview title/asset count. Reconfirm if any of these change. A source file whose bytes can be mutated behind the same URI still needs an immutable provider revision or a verified content hash, if available. File names alone are insufficient to assert byte-level equality.

The local guard is not a server-side authorization mechanism or a substitute for actual host confirmation. Call the live MCP with permitted host-supported attachments only, after explicit consent.

The standalone `portable_brief.py` exports a vendor-neutral Markdown brief **without** handoff contact and submission permissions. It does not upload any material.

## v0.4 cross-department event state
The existing `departments: 01–15` remains a pedagogical phase map for backwards compatibility; an optional separate `department_functions: D01–D22` describes work functions from `DEPARTMENT_CONTRACTS_22.json`. No automatic migration should silently convert historical approvals or multiply staff requirements. `fields` may store `value, provenance, status`; `events` records proposed/approved/rejected/lock changes; `revalidation_queue` signals downstream deliverables that need review. Source metadata must identify which file/image was actually accessible and what it can control. No contact or handoff field goes into the ordinary public export unless the user explicitly requests it.

The local `creative_state.py` is only a reducer reference; it does not authenticate real user actions or persist server data. A host adapter must verify actor identity and explicit consent separately before invoking approval or send.
