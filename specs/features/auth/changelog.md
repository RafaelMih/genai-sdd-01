# Changelog - Auth

## v1.1.0

- Resolved dashboard redirect path: /dashboard
- Added error messages contract with Firebase error code → pt-BR string mapping
- Added validation contract (email regex + password min 6 chars via Zod)
- Clarified validation timing: client-side first, Firebase not called on failure
- Added AC11: loading state during submission
- Added AC12: already-authenticated user redirect
- Removed misleading dependency on security-rules spec (no Firestore writes in this feature)
- Added Firestore behavior section clarifying no document is written at login
- Added account provisioning note (sign-up is out of scope)
- Removed open question about dashboard path (resolved)

## v1.0.0

- Initial auth spec with email/password login
