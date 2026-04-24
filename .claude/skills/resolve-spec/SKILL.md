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
- Do NOT leave "TBD", "open questions", or equivalent placeholders
- All decisions MUST be explicit in the spec text
- The result MUST be fully implementable without further clarification
- If a behavior depends on another feature or existing system, define the dependency explicitly as a contract
- The canonical `CONTEXT.md` must remain alignable with the resolved spec

---

## Resolution Checklist

You MUST validate and resolve all of the following areas:

### 1. Functional behavior

- success flows
- error flows
- empty states
- loading states
- retry behavior
- invalid input handling
- edge cases

### 2. Navigation contract

For every navigation in the spec, explicitly define:

- source state/page
- trigger
- destination path
- whether navigation uses push or replace
- whether browser back should return to prior page

If redirect behavior exists, it must be stated in a dedicated section named `Redirect contract`.

### 3. Authentication and authorization contract

Explicitly define:

- whether auth is required
- authenticated behavior
- unauthenticated behavior
- insufficient permission behavior if relevant

### 4. Data contract

Explicitly define, where applicable:

- required inputs
- optional inputs
- validation rules
- normalization rules
- persisted fields
- transient UI-only state

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

### 7. Internal consistency

Resolve contradictions across:

- summary
- scope
- user flows
- acceptance criteria
- contracts
- edge cases
- out of scope
- `CONTEXT.md`

If two sections conflict, keep only one final rule.

---

## Steps

### 1. Resolve target files

Locate:

- active spec: `specs/features/<feature>/spec-v<version>.md`
- canonical context: `specs/features/<feature>/CONTEXT.md`

### 2. Read context first

Read `CONTEXT.md` first to understand the current active boundary.

### 3. Read the full spec

Read the full spec before making any decision.

### 4. Audit the spec

Identify and classify:

- ambiguities
- missing contracts
- untestable acceptance criteria
- undefined behaviors
- hidden assumptions
- contradictions
- stale context summary

### 5. Resolve issues

Convert every vague or implicit behavior into an explicit rule.

### 6. Normalize navigation and redirect behavior

Create or update a dedicated section named `## Redirect contract`.

If no redirects exist, state:

- `No redirects are part of this feature.`

### 7. Normalize dependency boundaries

If the spec depends on an external feature/system, explicitly state:

- what is assumed to exist
- what behavior is guaranteed by this feature
- what is not implemented here

### 8. Remove unresolved language

The final spec must not contain:

- TBD
- open question
- to be decided
- maybe
- ideally
- as appropriate

### 9. Versioning

Choose the new version number:

- Patch for clarification, consistency, contracts, and non-behavioral fixes
- Minor if externally observable behavior changed

### 10. Context sync

Ensure the canonical context can be regenerated or updated so that:

- `CONTEXT.md` points to the new active spec version
- the summarized scope, acceptance criteria, dependencies, and tests match the active spec

### 11. Final readiness gate

Before producing the final answer, verify:

- all navigation is explicit
- all redirects are explicit
- all auth behavior is explicit
- all acceptance criteria are testable
- no unresolved decisions remain
- the canonical `CONTEXT.md` can summarize the feature without contradiction

If any of the above fails, verdict must be `Not ready`.

---

## Output Format

### 1. New version number

Provide only the new version number.

### 2. Updated spec

Return the FULL updated spec content.

### 3. Context impact

List what must change in `CONTEXT.md`.

### 4. Changes made

List:

- resolved ambiguities
- added contracts
- contradictions removed
- context updates required

### 5. Remaining risks

List only real implementation risks that remain after resolution.

### 6. Final verdict

Return exactly one of:

- `Ready for implementation`
- `Not ready`

---

## Definition of Done

The spec is done only when:

- a developer can implement it without follow-up questions
- a tester can validate it with deterministic checks
- a reviewer cannot claim ambiguity without contradicting explicit text in the spec
- the canonical `CONTEXT.md` can summarize the feature without contradicting the active spec
