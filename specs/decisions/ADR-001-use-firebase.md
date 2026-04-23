# ADR-001 - Use Firebase

## Status

Accepted

## Context

The project needs fast auth, document storage, hosting, and optional server-side logic.

## Decision

Use Firebase Auth, Firestore, and Hosting by default.
Use Cloud Functions only when server trust is required.

## Consequences

- Faster bootstrap
- Simple auth and hosting integration
- Security rules become critical
