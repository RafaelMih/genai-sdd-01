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

- Load the active feature context before expanding to full specs.
- Prefer `CONTEXT.md` plus targeted sections over full-document loading.
- Use full spec retrieval only when the short context is insufficient.
- `summary` is the default retrieval mode; `full` should be explicit and exceptional.
- `chunked` context should stay within the configured chunk/token budget whenever possible.
- Budget overages are warning-only for now, but they must be reported via telemetry.
- Repeated context retrieval should prefer the local cache when source files have not changed.
- Run `npm run specs:archive` periodically so superseded specs do not leak into the active mental model.
