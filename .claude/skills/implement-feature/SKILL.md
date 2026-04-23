---
name: implement-feature
description: Implement a feature strictly from an active spec with minimal context and full traceability.
---

# Implement Feature

## Goal

Implement only the active feature described in the provided spec.

## Required inputs

- Active feature spec
- Referenced technical specs
- Relevant ADRs
- Existing feature code
- Existing feature tests

## Procedure

1. Read the active spec only.
2. Extract:
   - scope
   - out of scope
   - acceptance criteria
   - dependencies
   - ambiguities
3. Read only the technical specs and ADRs directly referenced.
4. Inspect the feature folder and nearby tests.
5. Produce a pre-implementation plan:
   - files to create/edit
   - criteria-to-code mapping
   - risks
6. Implement in small steps.
7. Add/update tests.
8. Update TRACEABILITY.md.
9. Summarize changes and unresolved issues.

## Hard limits

- Do not inspect unrelated features.
- Do not add dependencies without justification.
- Do not refactor unrelated modules.
- Do not guess missing requirements.
