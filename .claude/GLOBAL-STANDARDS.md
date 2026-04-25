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

### Escalation order

1. **CONTEXT.md** - always first; use the canonical short feature boundary
2. **summary mode with intent** - ask only for the sections needed by the task
3. **chunked mode with intent** - use the smallest chunk set possible
4. **full mode** - only when every smaller option is insufficient and only with explicit justification

Never load `full` as a first step. Never skip steps.

### Budget table

| Task intent | Preferred path                                                             | Soft limit | Hard block |
| ----------- | -------------------------------------------------------------------------- | ---------: | ---------: |
| implement   | `CONTEXT.md` -> `summary(intent=implement)` -> `chunked(intent=implement)` |       700t |          - |
| test        | `CONTEXT.md` -> `summary(intent=test)` -> `chunked(intent=test)`           |       900t |          - |
| review      | `CONTEXT.md` -> `summary(intent=review)` -> `chunked(intent=review)`       |      1000t |          - |
| drift       | `CONTEXT.md` -> `summary(intent=drift)` -> `chunked(intent=drift)`         |       900t |          - |
| full        | explicit exception only                                                    |      4000t |      6000t |

### Cache and telemetry

- Repeated context retrieval must prefer the local cache when source files have not changed.
- Cache keys must include feature, version, intent, mode, and only the files relevant to that retrieval scope.
- `TRACEABILITY-SUMMARY.md` is opt-in and should be loaded only for `test`, `review`, or `drift` work.
- Budget overages are reported via telemetry; full mode overages above the hard block are rejected.
- Telemetry must record served blocks so low-value context can be removed over time.
- Run `npm run specs:archive` periodically so superseded specs do not leak into the active working set.
