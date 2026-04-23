---
name: generate-tests-from-spec
description: Generate tests strictly from the active feature spec and traceability mapping.
---

# Generate Tests From Spec

## Goal

Transform acceptance criteria into test cases without inventing behavior.

## Required inputs

- active feature spec
- TRACEABILITY.md
- relevant implementation files
- nearby existing tests

## Procedure

1. Read only the active spec.
2. Extract every acceptance criterion.
3. For each criterion:
   - identify expected user-visible behavior
   - classify as unit, integration, or e2e
   - map to existing code areas
4. Generate only tests supported by the spec.
5. Do not create tests for behavior not present in the spec.
6. If a criterion is vague, stop and report ambiguity instead of generating a test.

## Output

- list of missing tests
- proposed test file changes
- generated tests
