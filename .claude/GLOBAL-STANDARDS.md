# Global Standards

This file is the canonical global guidance for the project.
When other docs repeat the same topic, prefer this file as the source of truth.

## Product and Process

- The active approved spec is the source of truth.
- Never implement from tasks alone.
- If the spec is ambiguous, incomplete, or not testable, stop and report the issue.
- Keep changes feature-scoped and map behavior to acceptance criteria.
- Every feature must keep spec, tasks, changelog, `TRACEABILITY.md`, and `CONTEXT.md`.
- Archived specs live in `specs/archive/<feature>/` and are outside the default working set.

## Architecture

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS v4
- Backend/BaaS: Firebase Auth + Firestore + Hosting
- Prefer Firebase client SDK for user-scoped operations.
- Use Cloud Functions only for secrets, privileged writes, or trusted third-party integrations.

## Code Organization

- Organize code by feature first.
- Keep components presentational when possible.
- Keep business logic in hooks and services.
- Prefer simple composition over new abstractions.

## Testing and Traceability

- Every acceptance criterion must map to at least one test.
- Prefer unit tests for pure logic and validation.
- Prefer integration tests for feature flows.
- Add E2E only for critical journeys.
- If behavior changes, update `specs/features/<feature>/TRACEABILITY.md`.

## AI Context

### Escalation order (lazy loading — never skip steps)

1. **CONTEXT.md** — always first; ~300–500 tokens; covers objective, scope, and ACs
2. **summary mode** — when CONTEXT.md is not enough; ~1400 tokens max; key spec sections only
3. **chunked mode** — when specific details are needed; ~900 tokens per chunk, max 6 chunks
4. **full mode** — only when all other modes are insufficient; 4000 tokens max; hard block above 6000 tokens

Never load `full` as a first step. Never skip steps.

### Budget table

| Mode | Soft limit | Hard block |
|------|-----------|------------|
| CONTEXT.md | 500t | — |
| summary | 1400t | — |
| chunked | 900t/chunk × 6 | — |
| full | 4000t | 6000t |

### Cache and telemetry

- Repeated context retrieval must prefer the local cache when source files have not changed.
- Cache fingerprint includes TRACEABILITY.md and changelog.md in addition to spec files.
- Budget overages are reported via telemetry; full mode overages above the hard block are rejected.
- Run `npm run specs:archive` periodically so superseded specs do not leak into the active working set.
