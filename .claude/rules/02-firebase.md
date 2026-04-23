# Firebase Rules

- Use Firebase modular SDK.
- Keep Firebase setup isolated in src/firebase.
- Prefer client SDK for user-scoped operations.
- Use Cloud Functions only for:
  - secrets
  - privileged writes
  - third-party API calls requiring server trust
- Security assumptions must be reflected in firestore.rules.
