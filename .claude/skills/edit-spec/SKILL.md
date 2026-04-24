---
name: edit-spec
description: Create a new version of any feature spec by copying the latest version and applying requested changes
---

# Edit Feature Spec

## Inputs

- feature: string (required)
- change_request: string (required)
- from_version: string (optional)
- to_version: string (optional)

## Version Resolution Rules

- If `from_version` is NOT provided:
  - Resolve the latest version from `specs/.index/spec-manifest.json` for the given feature
  - Use the highest semantic version (e.g., 1.2.0 > 1.1.5 > 1.0.0)

- If `to_version` is NOT provided:
  - Increment the `from_version` using semantic versioning:
    - Default: increment MINOR → `1.0.0 → 1.1.0`
  - If change_request explicitly indicates:
    - "fix", "bug", "typo" → PATCH
    - "breaking", "change behavior", "remove" → MAJOR

## Required Tool

Before reading, planning, editing, or writing files, call:

`retrieve_relevant_specs`

Input:

```json
{
  "feature": "<feature-name>",
  "version": "<resolved-from_version>",
  "detail": "summary"
}
```

Prefer the short context first. Escalate to `detail: "full"` only when the requested edit cannot be performed safely from the summary plus the active spec file.

Additional rules:

- Treat `CONTEXT.md` as the canonical short briefing for the active feature.
- Keep archived specs in `specs/archive/` out of the working set unless the edit request is explicitly historical.
- Prefer budget-safe retrieval (`summary`) before opening the full spec.
- If changing active behavior, ensure the resulting feature can still be summarized cleanly in `CONTEXT.md`.
- Every accepted spec edit MUST produce a new spec version for the feature.
- Do not overwrite the currently active spec in place.
- After creating the new active version and updating the related feature docs, run `npm run specs:archive` to move superseded versions out of the working set.

## Required Output Artifacts

After editing a feature spec, keep these artifacts aligned with the new version:

- `specs/features/<feature>/spec-v<new-version>.md`
- `specs/features/<feature>/CONTEXT.md`
- `specs/features/<feature>/TRACEABILITY.md`
- `specs/features/<feature>/TRACEABILITY-SUMMARY.md` when present in the project workflow
- `specs/features/<feature>/changelog.md`
- `specs/.index/spec-manifest.json` when the repository tracks active versions there

## Required Flow

1. Resolve the current active version.
2. Resolve the next version number using semver rules.
3. Create a new spec file for that next version.
4. Apply the requested change only in the new version.
5. Update the feature-level supporting docs so they point to the new version.
6. Mark the new version as the active one in repository metadata when applicable.
7. Run `npm run specs:archive` after the edit so superseded specs leave the active working set.
8. If the repository uses indexing or generated feature summaries, regenerate them after the version change.

## Never Do

- Never edit the old active spec in place when the request changes feature behavior.
- Never leave `CONTEXT.md` or `TRACEABILITY.md` pointing to the previous active version after a spec edit.
- Never skip `specs:archive` once a new active version has been created.
