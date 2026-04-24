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
