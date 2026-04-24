---
name: reconcile-drift
description: Detect and classify inconsistencies between implementation, tests, and the active feature spec, producing actionable fixes.
---

# Reconcile Drift

## Goal

Identify and classify any divergence between the current implementation, tests, and the active feature spec, and propose the minimal corrective action.

---

## Inputs

- `specs/features/<feature>/CONTEXT.md`
- Active feature spec (latest approved version)
- `specs/features/<feature>/TRACEABILITY.md`
- Source code (modules referenced in traceability)
- Test suite (unit, integration, e2e)

---

## Definitions

- **Code drift**: Implementation does not satisfy the spec.
- **Spec drift**: Spec is outdated or inconsistent with intended behavior.
- **Context drift**: `CONTEXT.md` is stale or contradicts the active spec.
- **Test drift**: Tests do not validate actual spec behavior.
- **Missing coverage**: Acceptance criteria not covered by tests.

---

## Process

### 1. Load Context

- Read `CONTEXT.md` first.
- Read the latest approved spec version.
- Extract all Acceptance Criteria (ACs).
- Load `TRACEABILITY.md` and map AC -> files -> tests.

Use the short context to understand the feature boundary before expanding to the full spec.

---

### 2. Validate Traceability Integrity

- Ensure every AC has:
  - at least one mapped module
  - at least one test reference
- Flag missing mappings immediately.

---

### 3. Evaluate Each Acceptance Criterion

For each AC:

#### 3.1 Check Implementation

- Inspect mapped modules.
- Determine if behavior satisfies the AC exactly.
- Avoid assumptions; only use explicit logic present in code.

#### 3.2 Check Tests

- Verify if:
  - a test exists
  - it actually validates the AC (not just partial behavior)
- Detect false positives (tests that pass but do not assert the AC properly).

#### 3.3 Check Canonical Context

- Verify whether `CONTEXT.md` still reflects the active feature boundary.
- Flag missing or stale summaries if `CONTEXT.md` diverges from the active spec.

---

### 4. Detect Drift

Classify issues per AC or artifact:

- `code_drift`: behavior != spec
- `spec_drift`: spec ambiguous, inconsistent, or contradicted by system behavior
- `context_drift`: `CONTEXT.md` is stale, missing key active behavior, or points to the wrong active spec
- `test_drift`: test exists but does not validate AC correctly
- `missing_test`: no test exists for AC
- `missing_mapping`: AC not linked in `TRACEABILITY.md`

---

### 5. Prioritize Issues

Order findings by impact:

1. Broken core functionality
2. Security or validation gaps
3. Incorrect business logic
4. Missing or stale context and traceability
5. Missing test coverage
6. Documentation inconsistencies

---

### 6. Suggest Fix Strategy

For each issue, propose the smallest viable fix:

- Code drift -> suggest exact code change
- Spec drift -> suggest spec update
- Context drift -> suggest regenerating or updating `CONTEXT.md`
- Test drift -> suggest test correction
- Missing test -> suggest test case
- Missing mapping -> suggest `TRACEABILITY.md` update

Avoid large refactors unless strictly necessary.

---

## Output Format

```md
## Drift Report: <feature-name>

### Summary

- Total ACs: X
- Issues found: Y

---

### AC<ID>: <short description>

**Status:** OK | DRIFT

**Findings:**

- Type: code_drift | spec_drift | context_drift | test_drift | missing_test | missing_mapping
- Description: <clear explanation>

**Suggested Fix:**

- <minimal actionable change>

---

## Global Issues

- <cross-cutting problems>

---

## Recommended Next Actions

1. ...
2. ...
```
