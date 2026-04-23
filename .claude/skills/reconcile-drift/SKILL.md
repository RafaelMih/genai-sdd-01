---
name: reconcile-drift
description: Compare implementation against a feature spec and identify drift.
---

# Reconcile Drift

## Goal

Find mismatches between current code and the active spec.

## Steps

1. Read active spec.
2. Read mapped files from TRACEABILITY.md.
3. Compare current behavior to acceptance criteria.
4. Classify each mismatch:
   - code drift
   - spec drift
   - missing test
5. Suggest the smallest correction path.
