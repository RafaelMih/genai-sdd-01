# Context - user-logout

Spec: specs/features/user-logout/spec-v1.1.0.md

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

## Objective

Allow an authenticated user to end their Firebase Auth session. After logout, the user is redirected to `/login` and cannot return to the page from which logout was triggered via browser back.

## Scope

- `LogoutButton` component: renders a button that triggers logout
- Firebase Auth `signOut` call
- Loading state during `signOut` (button disabled, label "Saindo...")
- Redirect to `/login` with `replace` navigation after successful logout
- Error handling: if `signOut` fails, display an error message below the button

## Out of scope

- Token revocation on backend
- Multi-device session management
- Idle/auto logout
- OAuth provider logout (Google, etc.)
- Route guard implementation (owned by auth feature; assumed to exist as a dependency)
- Placement of `LogoutButton` in app layout (this spec defines component behavior only)

## User flow

1. Authenticated user clicks the logout button (label: "Sair")
2. Button is disabled and its label changes to "Saindo..."
3. System calls `signOut(auth)` from the Firebase Auth SDK
4. If `signOut` succeeds:
   - Firebase `onAuthStateChanged` fires with `null`
   - App user state (via `useAuthState`) updates to `null`
   - System navigates to `/login` with `replace` semantics; browser back from `/login` will not return to the page from which logout was triggered
5. If `signOut` fails:
   - Button is re-enabled with label "Sair"
   - Error message is displayed below the button (see Error messages contract)
   - User remains on the current page

## Acceptance criteria

- AC1: When the authenticated user clicks the logout button, the component calls `signOut(auth)`
- AC2: While the `signOut` request is in progress, the button displays the label "Saindo..." and remains disabled
- AC3: When `signOut` succeeds, the app navigates to `/login` using `replace` navigation
- AC4: When `signOut` succeeds and Firebase emits `onAuthStateChanged(null)`, `useAuthState` returns `null` to consuming components
- AC5: When `signOut` fails, the component displays the error message "Erro ao sair da conta." below the logout button and re-enables the button with label "Sair"
- AC6: When logout succeeds and the app has navigated to `/login` with `replace`, pressing browser back from `/login` does not return to the page from which logout was triggered

## Dependencies

- Firebase Auth SDK: `signOut`, `AuthError.code`
- `useAuthState` hook -> provides reactive auth state to components
- Route guard for authenticated routes -> ensures unauthenticated users cannot reach protected pages after logout; owned by the auth feature
- Route `/login` -> must exist and be reachable

## Tests

| Caso de teste                                                        | Tipo        | ACs cobertos |
| -------------------------------------------------------------------- | ----------- | ------------ |
| Clicar no botão chama `signOut(auth)`                                | Unit        | AC1          |
| Botão mostra "Saindo..." e fica desabilitado durante o `signOut`     | Integration | AC2          |
| Logout bem-sucedido navega para /login com replace                   | Integration | AC3          |
| Após logout, `useAuthState` retorna null                             | Integration | AC4          |
| Falha no `signOut`: mostra "Erro ao sair da conta." abaixo do botão  | Integration | AC5          |
| Falha no `signOut`: botão reabilitado com label "Sair"               | Integration | AC5          |
| Browser back de /login após logout não retorna à página de origem    | Integration | AC6          |
| `auth/network-request-failed` -> "Erro de conexão. Tente novamente." | Unit        | AC5          |
