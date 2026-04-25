# Context - user-logout

Spec: specs/features/user-logout/spec-v1.1.0.md

Contexto canonico curto para trabalho assistido por IA.
Use este arquivo antes de qualquer retrieval expandido.

## Objective

Allow an authenticated user to end their Firebase Auth session. After logout, the user is redirected to `/login` and cannot return to the page from which logout was triggered via browser back.

## Scope

- `LogoutButton` component: renders a button that triggers logout
- Firebase Auth `signOut` call
- Loading state during `signOut` (button disabled, label "Saindo...")
- Redirect to `/login` with `replace` navigation after successful logout
- Error handling: if `signOut` fails, display an error message below the button

## Active Acceptance Criteria

- AC1: When the authenticated user clicks the logout button, the component calls `signOut(auth)`
- AC2: While the `signOut` request is in progress, the button displays the label "Saindo..." and remains disabled
- AC3: When `signOut` succeeds, the app navigates to `/login` using `replace` navigation
- AC4: When `signOut` succeeds and Firebase emits `onAuthStateChanged(null)`, `useAuthState` returns `null` to consuming components
- AC5: When `signOut` fails, the component displays the error message "Erro ao sair da conta." below the logout button and re-enables the button with label "Sair"
- AC6: When logout succeeds and the app has navigated to `/login` with `replace`, pressing browser back from `/login` does not return to the page from which lo...

## Contracts

- Auth state contract: `LogoutButton` is rendered only inside auth-gated layouts. The component itself does not manage auth state routing; that is the responsibility of route guards (declared dependency).
- Redirect contract: Navigation is performed via the router's `navigate` function (not a hard page reload).
- UI state contract: - Error message lifecycle: displayed after a failed `signOut`; cleared when a new logout attempt begins
- Error messages contract: > The error code is read from the `code` property (type: `string`) of the Firebase `AuthError`

## Target Files

- LogoutButton.tsx
- Firebase SDK (implícito via signOut)
- logoutErrors.ts
- LogoutButton.tsx (replace: true)
