# REMAKE 0.33 — G4 public project revision security

The unauthenticated MCP cannot establish author identity, human approval, semantic perception, source rights or whether user really selected an attachment.

## Public event capabilities

| Event | Status | Why |
|---|---|---|
| material_add | DRAFT-ONLY | host_inspected false; no fake OBSERVED, VERIFIED or attested SHA |
| shot_add | DRAFT-ONLY | status PROPOSED; no approval_ref or approved flag |
| shot_field_set | PROPOSED SHOTS ONLY | immutable approved, locked and rejected shots |
| decision_propose | DRAFT-ONLY | status PROPOSED; no approval_ref or approved flag |
| lock_set and lock_remove | DENIED | no authenticated human author |
| decision_approve / decision_reject | DENIED | no identity or consent confirmation |

Enforcement: `public-delta-guard-v033.mjs` checks incoming tool arguments inside the `worker.mjs` JSON-RPC `tools/call` dispatch, **before** `callCanonical`. The returned content is a stateless draft for the host to save. It is NOT a persistent authenticated project. Existing user-supplied project packet may itself contain unverifiable locks/approvals; do not claim these verified.

## Negative acceptance receipts

GitHub Actions `REMAKE MCP integration` includes `tests/public-delta-guard-v033.mjs`: 20/20 direct JSON-RPC tests for spoofed author identity, fake approval, lock modification, forged OBSERVED, fake EXTERNAL_VERIFIED provenance, invented SHA receipt, forbidden shot approval, rejected/approved shot mutation and legitimate model draft operations. The earlier 9-tool batch/image tests also run. Tests are synthetic; real ChatGPT fileParam reception and blind professional quality review remain unverified.

## Honest status

G4 improved to guarded public drafts; no privileged approvals until G5 real authorization + explicit human confirmation is deployed, independently integration-tested, revoked and audited. Do not label G4 or v1.0 PASS.
