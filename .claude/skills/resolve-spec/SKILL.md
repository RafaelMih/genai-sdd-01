---
name: resolve-spec
description: Resolve ambiguities and produce a corrected, implementation-ready version of a spec
---

# Resolve Spec

## Rules

- Do NOT generate code
- Do NOT introduce new features not present in the original spec
- All decisions MUST be explicit in the spec (no implicit assumptions)
- The result MUST be fully implementable without further clarification

---

## Steps

1. Resolve spec path:
   - specs/features/<feature>/v<version>/spec.md

2. Read the full spec

3. Identify and fix:
   - ambiguities
   - missing contracts (API, auth, data, navigation)
   - untestable acceptance criteria
   - undefined behaviors (error states, edge cases)
   - hidden assumptions

4. Convert vague requirements into explicit rules:
   - replace subjective language with concrete behavior
   - define exact messages, paths, and states

5. Ensure the spec is executable:
   - all acceptance criteria are testable
   - all flows are defined (success + error)
   - no "TBD", "open questions", or unresolved decisions remain

6. Versioning:
   - Patch (vX.X.X → vX.X.(X+1)) for fixes
   - Minor (vX.X.X → vX.(X+1).0) if behavior changed

---

## Output

1. New version number
2. Updated spec (FULL content)
3. Changes made:
   - list of resolved ambiguities
   - list of added contracts
4. Remaining risks (if any)
5. Final verdict:
   - Ready for implementation OR Not ready
