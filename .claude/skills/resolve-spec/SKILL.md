---
name: resolve-spec
description: Resolve ambiguities, eliminate hidden assumptions, and produce a corrected, implementation-ready version of a spec
---

# Resolve Spec

## Purpose

Take an existing spec and produce a new version that is fully explicit, internally consistent, testable, and implementation-ready.

The output must remove ambiguity rather than describe it.

---

## Hard Rules

- Do NOT generate code
- Do NOT introduce new product features that are not already present in the original spec
- Do NOT preserve unresolved decisions
- Do NOT leave "TBD", "open questions", "to define later", or equivalent placeholders
- Do NOT keep reviewer comments or blockers as truth without validating them against the spec content
- All decisions MUST be explicit in the spec text
- The result MUST be fully implementable without further clarification
- If a reviewer comment conflicts with the spec, resolve the conflict explicitly in the new version
- If a behavior depends on another feature or existing system, define the dependency explicitly as a contract, not as an ambiguity

---

## Required Validation Mindset

Before marking something as ambiguous or missing, verify whether it is already explicitly defined somewhere else in the spec.

Use this rule:

- **Undefined** = no explicit rule exists
- **Ambiguous** = multiple reasonable interpretations exist
- **Dependent** = behavior is defined, but relies on another existing feature/system
- **Out of scope** = intentionally excluded, but must not block implementation of scoped behavior

Never label something as unresolved if the spec already contains an explicit decision.

Example:

- If redirect destination is explicitly stated in flow, acceptance criteria, or contracts, then redirect path is **resolved**
- If the route exists but its guarding mechanism is owned by another feature, then it is a **dependency**, not an unresolved redirect decision

---

## Resolution Checklist

You MUST validate and resolve all of the following areas:

### 1. Functional behavior

- success flows
- error flows
- empty states
- loading states
- retry behavior
- cancellation behavior
- invalid input handling
- edge cases

### 2. Navigation contract

For every navigation in the spec, explicitly define:

- source state/page
- trigger
- destination path
- whether navigation uses push or replace
- whether browser back should return to prior page
- whether authenticated/unauthenticated users are redirected
- fallback path if access is denied

If redirect behavior exists, it must be stated in a dedicated section named `Redirect contract`.

If a reviewer claimed redirect ambiguity, explicitly verify:

- destination path
- timing of redirect
- condition that triggers redirect
- replace vs push semantics

### 3. Authentication and authorization contract

Explicitly define:

- whether auth is required
- authenticated behavior
- unauthenticated behavior
- expired session behavior
- insufficient permission behavior
- whether route protection is in scope or dependency-only

### 4. Data contract

Explicitly define, where applicable:

- required inputs
- optional inputs
- validation rules
- normalization rules
- persisted fields
- transient UI-only state
- server response expectations
- error payload expectations if relevant

### 5. UI state contract

Explicitly define:

- default state
- submitting state
- disabled state
- loading indicators
- inline validation behavior
- global error behavior
- success feedback behavior

### 6. Acceptance criteria quality

Every acceptance criterion must be:

- binary
- observable
- testable
- free of subjective wording

Replace vague terms like:

- “works correctly”
- “user-friendly”
- “fast”
- “appropriate”
- “should handle”
- “redirect properly”

with exact behavior.

### 7. Internal consistency

Resolve contradictions across:

- summary
- scope
- user flows
- acceptance criteria
- contracts
- edge cases
- out of scope

If two sections conflict, the new version must contain only one final rule.

---

## Steps

### 1. Resolve spec path

Locate the target file:

- `specs/features/<feature>/v<version>/spec.md`

### 2. Read the full spec

Read the entire spec before making any decision.

Do not infer missing behavior from partial reading.

### 3. Audit the spec

Identify and classify issues into these buckets:

- ambiguities
- missing contracts
- untestable acceptance criteria
- undefined behaviors
- hidden assumptions
- contradictions
- invalid reviewer assumptions

### 4. Resolve issues

Convert every vague or implicit behavior into an explicit rule.

This includes:

- exact paths
- exact redirect rules
- exact error messages if the spec requires visible messaging
- exact loading/submitting behavior
- exact validation outcomes
- exact empty/error/success states

### 5. Normalize navigation and redirect behavior

Create or update a dedicated section named:

- `## Redirect contract`

This section must explicitly define all redirect rules in the feature.

If no redirects exist, state:

- `No redirects are part of this feature.`

### 6. Normalize dependency boundaries

If the spec depends on an external feature/system, explicitly state:

- what is assumed to exist
- what behavior is guaranteed by this feature
- what is not implemented here

Dependencies must not remain as vague assumptions.

### 7. Remove unresolved language

The final spec must not contain:

- TBD
- open question
- to be decided
- later
- maybe
- ideally
- if needed
- as appropriate
- where applicable

Replace with concrete rules.

### 8. Versioning

Choose the new version number:

- Patch (`vX.X.X` → `vX.X.(X+1)`) for clarification, consistency, contracts, and non-behavioral fixes
- Minor (`vX.X.X` → `vX.(X+1).0`) if externally observable behavior changed

### 9. Final readiness gate

Before producing the final answer, verify:

- all navigation is explicit
- all redirects are explicit
- all auth behavior is explicit
- all acceptance criteria are testable
- no unresolved decisions remain
- no reviewer blocker remains unvalidated
- spec can be implemented without asking follow-up questions

If any of the above fails, verdict must be `Not ready`.

---

## Output Format

### 1. New version number

Provide only the new version number.

### 2. Updated spec

Return the FULL updated spec content.

### 3. Changes made

List:

- resolved ambiguities
- added contracts
- contradictions removed
- reviewer assumptions corrected

### 4. Remaining risks

List only real implementation risks that remain after resolution.

A risk is allowed only if:

- it does not block implementation of this feature
- it is external to the scope
- it is clearly identified as dependency or rollout risk

Do NOT list unresolved spec decisions here.

### 5. Final verdict

Return exactly one of:

- `Ready for implementation`
- `Not ready`

---

## Additional Enforcement Rules

### A. Reviewer-comment validation

If the source spec or review includes comments such as blockers, warnings, or TODOs, validate each one against the actual spec text.

For each comment:

- keep it only if still true
- otherwise resolve it and remove its effect from the new version

A reviewer comment is not automatically a fact.

### B. Redirect decision enforcement

A redirect decision is considered resolved only if all of the following are explicit:

- triggering condition
- destination path
- navigation semantics (`push` or `replace`)
- timing/point in flow

If one of these is missing, fix it in the spec.

### C. Dependency enforcement

If behavior relies on another route, middleware, guard, or service:

- name it explicitly as a dependency
- define expected behavior at the feature boundary
- do not treat this as unresolved unless the current feature cannot be implemented without making a new product decision

### D. No hidden assumptions

Any assumption that an implementer would need in order to ship the feature must be converted into explicit spec text.

If it is required to build, test, or review the feature, it must be written down.

---

## Definition of Done

The spec is done only when:

- a developer can implement it without follow-up questions
- a tester can validate it with deterministic checks
- a reviewer cannot claim ambiguity without contradicting explicit text in the spec
