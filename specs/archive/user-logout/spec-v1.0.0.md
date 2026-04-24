# Feature Spec: User Logout

Version: 1.0.0
Status: Draft

## Objective

Allow an authenticated user to securely end their session and return to the login page.

## Scope

- Logout action (button/menu)
- Firebase Auth signOut
- Session cleanup (client-side)
- Redirect after logout
- Handling logout errors

## Out of scope

- Token revocation on backend
- Multi-device session management
- Idle/auto logout
- OAuth provider logout (Google, etc.)

## User flow

1. Authenticated user clicks logout
2. System triggers logout action
3. System calls Firebase Auth signOut
4. System clears client session state
5. On success, user is redirected to /login
6. On failure, system shows error message

## Auth state contract

| State         | Behavior           |
| ------------- | ------------------ |
| authenticated | logout allowed     |
| null          | redirect to /login |
| undefined     | show loading       |

## Redirect contract

| Trigger        | From       | To     | Type    | Back behavior |
| -------------- | ---------- | ------ | ------- | ------------- |
| logout success | any (auth) | /login | replace | cannot return |

## UI state contract

| State      | Button label | Disabled |
| ---------- | ------------ | -------- |
| default    | Sair         | false    |
| submitting | Saindo...    | true     |
| error      | Sair         | false    |

## Error messages contract

| Scenario        | Message                           |
| --------------- | --------------------------------- |
| network failure | Erro de conexão. Tente novamente. |
| unknown error   | Erro ao sair da conta.            |

## Session cleanup contract

- Clear Firebase Auth session via `signOut`
- Clear in-memory user state (context/store)
- Clear persisted session (cookies/localStorage if used)
- Cancel active listeners (e.g., onSnapshot)

## Acceptance criteria

- AC1: Clicking logout triggers Firebase signOut
- AC2: While logging out, button shows "Saindo..." and is disabled
- AC3: After successful logout, user is redirected to `/login` using replace navigation
- AC4: After logout, accessing protected routes redirects to `/login`
- AC5: After logout, user state is null
- AC6: If logout fails, show "Erro ao sair da conta."
- AC7: After logout, browser back does not return to authenticated pages

## Dependencies

- specs/features/auth/spec-v1.0.0.md
- specs/technical/security-rules-v1.0.0.md

## Tests

- unit:
  - logout action calls signOut
  - error mapping

- integration:
  - logout flow clears session and redirects
  - protected route blocked after logout
  - error handling on failure

- e2e:
  - user logs out and cannot access protected pages

## Open questions

- None
