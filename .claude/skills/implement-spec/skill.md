---
name: implement-spec
description: Implement a feature strictly from an approved spec using the RAG/MCP spec retriever
---

---

# Implement Spec

## Inputs

- feature: string (required)
- version: string (optional)

## Required Tool

Before reading, planning, editing, or testing code, call:

`retrieve_relevant_specs`

Preferred first call:

```json
{
  "feature": "<feature-name>",
  "detail": "summary"
}
```

Required input when full detail is needed:

```json
{
  "feature": "<feature-name>"
}
```

Optional input when version is provided:

```json
{
  "feature": "<feature-name>",
  "version": "<spec-version>"
}
```

## Rules

- ALWAYS call `retrieve_relevant_specs` first.
- Prefer the `summary` detail mode first and expand to `full` only if the short context is insufficient.
- If `version` is provided, it MUST be passed to the tool.
- ONLY use specs returned by RAG as source of truth.
- Prefer `specs/features/<feature>/CONTEXT.md` plus targeted spec sections over loading full documents by default.
- ONLY proceed if the main feature spec contains `Status: Approved`.
- If status is missing or not `Approved` → STOP.
- If the spec has `Open questions` with unresolved implementation decisions → STOP.
- Do NOT invent routes, fields, validations, labels, redirects, database paths, or UI behavior.
- Do NOT inspect unrelated files unless needed to implement the loaded spec.
- Implement the smallest solution that satisfies the acceptance criteria.
- Tests must map directly to acceptance criteria.
- Update traceability after implementation.
- Traceability MUST be stored next to the spec, not inside the implementation feature folder.

### Traceability Location

- Path convention:

```txt
specs/features/<feature>/TRACEABILITY.md
```

- The `Spec:` line inside `TRACEABILITY.md` MUST point to the active spec version.

- Do NOT create or update traceability files under:

```txt
src/features/<feature>/
```

- If a traceability file already exists inside the implementation folder:
  - Do NOT update it
  - Report it as misplaced
  - Recommend moving it to:

```txt
specs/features/<feature>/
```

## Steps

1. Call `retrieve_relevant_specs` with:
   - feature (required)
   - version (if provided)

2. Identify the main feature spec from the returned documents.

3. Validate:
   - Status is `Approved`
   - version
   - scope
   - out of scope
   - acceptance criteria
   - dependencies
   - open questions

4. Determine spec version:
   - Use the provided `version` input when available
   - Otherwise, use the version declared in the approved spec
   - If version cannot be determined → STOP

5. Map each Acceptance Criteria (AC) to:
   - target module/file
   - implementation change
   - test case

6. Implement the minimal solution.

7. Add or update tests.

8. Run relevant tests.

9. Add or update the traceability file at:

```txt
specs/features/<feature>/TRACEABILITY.md
```

10. Report result.

## Traceability Template

```md
# Traceability - <Feature>

Spec: specs/features/<feature>/spec-v<version>.md

## Acceptance Criteria Mapping

| AC  | Criteria | Module(s) | Test Case(s) |
| --- | -------- | --------- | ------------ |
| AC1 | ...      | ...       | ...          |

## Files Changed

| File | Reason |
| ---- | ------ |
| ...  | ...    |

## Tests Executed

| Command | Result        |
| ------- | ------------- |
| ...     | Passed/Failed |

## Blocked Items

- None
```

## Output

Return:

1. Feature and version used
2. RAG documents used
3. Files changed
4. Tests added/updated
5. AC mapping
6. Tests executed
7. Traceability file path
8. Any misplaced traceability files found
9. Any blocked items
