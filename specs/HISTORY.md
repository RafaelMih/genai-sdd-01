# Spec History Strategy

This file defines the strategy for keeping historical specs without polluting the active working set.

## Goal

Preserve auditability while reducing noise and context cost during day-to-day implementation work.

## Active working set

The active working set for a feature is:

- the latest approved spec file
- `CONTEXT.md`
- `TRACEABILITY.md`
- the feature changelog
- explicitly referenced technical specs and ADRs

## Historical specs

Older versions remain valid as history, but should be treated as archival reference.

Recommended handling:

1. Keep only the latest approved spec in the normal implementation flow.
2. Keep older versions in the same folder only while the feature is still evolving rapidly.
3. When a feature stabilizes, move superseded specs to `specs/archive/<feature>/`.
4. Leave a short pointer in the feature folder changelog indicating where historical versions were archived.
5. Do not load archived specs into AI context unless the task is explicitly historical, comparative, or forensic.

## Suggested archive trigger

Archive superseded specs when all conditions are true:

- there are at least 3 superseded versions
- the latest version is approved and stable
- the current implementation and traceability already reflect the latest approved version
- no active task depends on comparing behavior across old versions

## Naming suggestion

- Active: `specs/features/<feature>/spec-vX.Y.Z.md`
- Archived: `specs/archive/<feature>/spec-vX.Y.Z.md`

## Tooling impact

- `spec:status`, `spec:trace`, `spec:coverage`, and `spec:drift` should continue to operate only on active feature folders
- AI context loaders should ignore `specs/archive/` by default
