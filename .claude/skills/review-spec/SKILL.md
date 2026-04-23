---
name: review-spec
description: Perform a strict spec review with lint-level validation for ambiguity, completeness, and implementation readiness
---

# Review Spec

## Purpose

Validate if a spec is truly implementation-ready using both:

- qualitative review
- strict lint-style validation rules

This is NOT a suggestion tool. It must identify concrete failures.

---

## Hard Rules

- Do NOT generate code
- Do NOT assume missing behavior — treat as error
- Do NOT ignore missing contracts
- Do NOT trust reviewer comments blindly — validate against spec
- If a required contract is missing, it MUST be reported
- If behavior is implicit, it MUST be reported
- If acceptance criteria are not testable, it MUST be reported

---

## Steps

1. Resolve spec path:
   - `specs/<feature>/<version>/spec.md`

2. Read the FULL spec

3. Perform TWO layers of validation:

---

## 🔎 LAYER 1 — Qualitative Review

Identify:

- conflicting requirements
- vague language
- missing edge cases
- untestable acceptance criteria
- hidden backend assumptions
- security implications

---

## 🔒 LAYER 2 — SPEC LINT (MANDATORY)

Validate the spec against required contracts.

### 1. Navigation & Redirect Lint

Check if ALL of the following exist:

- explicit navigation triggers
- explicit destination paths
- explicit navigation type (push vs replace)
- explicit redirect conditions

If redirect exists but no **dedicated "Redirect contract" section**, report:

> [BLOCKER] Missing explicit redirect contract

If redirect behavior is spread across flow/AC without consolidation:

> [WARNING] Redirect logic is fragmented and may cause inconsistency

---

### 2. Auth Contract Lint

Check if defined:

- authenticated behavior
- unauthenticated behavior
- expired session behavior

If missing:

> [BLOCKER] Missing authentication contract

---

### 3. State Handling Lint

Check if defined:

- loading state
- error state
- empty state
- success state

If any missing:

> [WARNING] Missing UI state definitions

---

### 4. Data Contract Lint

Check if defined:

- required inputs
- validation rules
- failure behavior

If implicit:

> [WARNING] Data contract is implicit

---

### 5. Acceptance Criteria Lint

Each AC must be:

- binary
- observable
- testable

If contains words like:

- "should"
- "properly"
- "correctly"
- "appropriately"

Report:

> [BLOCKER] Untestable acceptance criteria detected

---

### 6. Dependency vs Missing Logic

If something depends on another feature:

- verify if dependency is EXPLICIT

If not:

> [WARNING] Hidden dependency not declared

---

### 7. Open Decisions Lint

Search for:

- TBD
- open question
- to be decided
- unclear behaviors

If found:

> [BLOCKER] Unresolved decision remains

---

## Output Format

### 1. Summary

Short, direct evaluation of spec quality

---

### 2. Blockers

List ONLY critical issues that prevent implementation

Format:

- [BLOCKER] description

---

### 3. Warnings

Non-blocking issues, but risky

Format:

- [WARNING] description

---

### 4. Ambiguities

List true ambiguities only (multiple interpretations possible)

---

### 5. Missing Contracts

Explicitly list missing sections or contracts

---

### 6. Risks

Real implementation risks (not spec issues)

---

### 7. Suggested Improvements

Concrete, actionable improvements

---

### 8. Final Verdict

- Ready for implementation
- Not ready for implementation

All outputs must be in Brazilian Portuguese.
