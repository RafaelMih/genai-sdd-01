# Testing Rules

Canonical reference: `.claude/GLOBAL-STANDARDS.md`

- Every acceptance criterion should map to at least one test.
- Prefer unit tests for validation and pure logic.
- Prefer integration tests for feature flows.
- Add E2E only for critical journeys.
- If behavior changes, update `specs/features/<feature>/TRACEABILITY.md`.
