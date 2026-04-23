# SDD Rules

- The active spec is the source of truth.
- Use semantic versioning for specs:
  - MAJOR: breaking behavior change
  - MINOR: new compatible behavior
  - PATCH: clarification only
- Every feature must have:
  - spec
  - tasks
  - changelog
  - traceability file
- Never implement from tasks alone; tasks depend on the spec.
- If the spec is ambiguous, stop and list the ambiguity.
