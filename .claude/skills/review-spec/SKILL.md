---
name: review-spec
description: Perform a strict spec review with lint-level validation for ambiguity, completeness, and implementation readiness
---

# Review Spec

## Purpose

Validate if a spec is truly implementation-ready using both:

- qualitative review
- strict lint-style validation rules

This is not a suggestion tool. It must identify concrete failures.

---

## Hard Rules

- Do NOT generate code
- Do NOT assume missing behavior; treat it as error
- Do NOT ignore missing contracts
- If a required contract is missing, it MUST be reported
- If behavior is implicit, it MUST be reported
- If acceptance criteria are not testable, it MUST be reported
- If `CONTEXT.md` is stale or missing, it MUST be reported

---

## Steps

1. Resolve target files:
   - `specs/features/<feature>/spec-v<version>.md`
   - `specs/features/<feature>/CONTEXT.md`

2. Read `CONTEXT.md` first, then use summary retrieval with `intent: "review"`. Read the FULL spec only if the review cannot be completed safely from the short material.

3. Perform two layers of validation

---

## Layer 1 - Qualitative Review

Identify:

- conflicting requirements
- vague language
- missing edge cases
- untestable acceptance criteria
- hidden backend assumptions
- stale canonical context

---

## Layer 2 - Spec Lint

Validate the spec against required contracts.

### 1. Navigation and Redirect Lint

Check if all of the following exist:

- explicit navigation triggers
- explicit destination paths
- explicit navigation type (push vs replace)
- explicit redirect conditions

If redirect exists but no dedicated `Redirect contract` section, report:

- [BLOCKER] Missing explicit redirect contract

### 2. Auth Contract Lint

Check if defined:

- authenticated behavior
- unauthenticated behavior
- expired or denied behavior when relevant

If missing:

- [BLOCKER] Missing authentication contract

### 3. State Handling Lint

Check if defined:

- loading state
- error state
- empty state when relevant
- success state

If any missing:

- [WARNING] Missing UI state definitions

### 4. Data Contract Lint

Check if defined:

- required inputs
- validation rules
- failure behavior

If implicit:

- [WARNING] Data contract is implicit

### 5. Acceptance Criteria Lint

Each AC must be:

- binary
- observable
- testable

If subjective or non-binary:

- [BLOCKER] Untestable acceptance criteria detected

### 6. Dependency vs Missing Logic

If something depends on another feature:

- verify if dependency is explicit

If not:

- [WARNING] Hidden dependency not declared

### 7. Open Decisions Lint

Search for:

- TBD
- open question
- to be decided
- unclear behaviors

If found:

- [BLOCKER] Unresolved decision remains

### 8. Context Sync Lint

Check if `CONTEXT.md` is aligned with the active spec.

If `CONTEXT.md` is missing:

- [WARNING] Missing canonical feature context

If `CONTEXT.md` contradicts the active spec:

- [WARNING] Canonical feature context is stale

---

## Output Format

### 1. Summary

Short, direct evaluation of spec quality.

### 2. Blockers

List only critical issues that prevent implementation.

### 3. Warnings

List non-blocking but risky issues.

### 4. Ambiguities

List true ambiguities only.

### 5. Missing Contracts

Explicitly list missing sections or contracts.

### 6. Context Issues

List mismatches or omissions in `CONTEXT.md`.

### 7. Risks

Real implementation risks only.

### 8. Suggested Improvements

Concrete, actionable improvements.

### 9. Final Verdict

- Ready for implementation
- Not ready for implementation

All outputs must be in Brazilian Portuguese.
