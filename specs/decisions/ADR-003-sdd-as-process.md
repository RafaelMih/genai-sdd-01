# ADR-003 - Spec-Driven Development as Process

## Status

Accepted

## Context

AI-assisted development is prone to scope creep, undocumented assumptions, and implementation drift. Without a structured process, features diverge from intent across iterations and acceptance criteria become implicit rather than explicit. This is amplified when the primary implementer is an AI agent that cannot recall prior decisions across sessions.

## Decision

Adopt Spec-Driven Development (SDD) as the mandatory process for all feature work:

- Every feature requires an approved spec (`Status: Approved`) before any code is written.
- Implementation must map directly to acceptance criteria — no invented behavior.
- Every AC must have at least one test referenced in `TRACEABILITY.md`.
- Drift between spec and code is detected automatically via `npm run spec:drift`.
- Specs are versioned with semantic versioning (MAJOR.MINOR.PATCH) and superseded versions are archived.

The enforcement chain is: spec lint → status gate → traceability check → AC coverage → drift detection (`npm run spec:check`).

## Consequences

- Higher upfront cost: spec must be written and approved before implementation starts
- Slower iteration for exploratory or prototyping work
- Higher traceability: every behavior change is tied to a spec version
- Reduces rework caused by undocumented assumptions
- Requires discipline to keep specs updated as the feature evolves
- AI agents can verify their own output against the spec before committing
