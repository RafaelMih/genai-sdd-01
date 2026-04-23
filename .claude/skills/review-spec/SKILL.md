---
name: review-spec
description: Review a feature spec for ambiguity, completeness, testability, and implementation risk.
---

# Review Spec

When invoked:

1. Resolve the target spec path using:
   - `specs/<feature>/<version>/spec.md`
2. Read the full spec before answering.
3. Do not implement code.
4. Review the spec for:
   - conflicting requirements
   - vague language
   - missing contracts
   - missing edge cases
   - untestable acceptance criteria
   - hidden backend assumptions
   - security rule implications

Output:

1. Clear summary
2. Ambiguities
3. Missing contracts
4. Risks
5. Suggested improvements
6. Final verdict: ready or not ready for implementation

All outputs must be in Brazilian Portuguese.
