# Feature Spec: User Logout

Version: 1.1.0
Status: Approved

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

## Auth state contract

`LogoutButton` is rendered only inside auth-gated layouts. The component itself does not manage auth state routing; that is the responsibility of route guards (declared dependency).

| Auth state  | `LogoutButton` behavior                              |
| ----------- | ---------------------------------------------------- |
| `User`      | Renders normally; logout button is interactive       |
| `null`      | Not rendered (component is inside auth-gated layout) |
| `undefined` | Not rendered (component is inside auth-gated layout) |

## Redirect contract

| Trigger           | Source                 | Destination | Semantics | Browser back from destination                               |
| ----------------- | ---------------------- | ----------- | --------- | ----------------------------------------------------------- |
| Successful logout | Any authenticated page | `/login`    | `replace` | Does not return to the page from which logout was triggered |

Navigation is performed via the router's `navigate` function (not a hard page reload).

## UI state contract

| State      | Button label | Button disabled | Error message          |
| ---------- | ------------ | --------------- | ---------------------- |
| Default    | Sair         | No              | Hidden                 |
| Submitting | Saindo...    | Yes             | Hidden                 |
| Error      | Sair         | No              | Visible (below button) |

- Error message lifecycle: displayed after a failed `signOut`; cleared when a new logout attempt begins
- Inline error is rendered immediately below the logout button

## Error messages contract

| Firebase error code           | Message displayed                 |
| ----------------------------- | --------------------------------- |
| `auth/network-request-failed` | Erro de conexão. Tente novamente. |
| (all other codes)             | Erro ao sair da conta.            |

> The error code is read from the `code` property (type: `string`) of the Firebase `AuthError`
> object thrown by `signOut`. If the thrown error does not have a `code` property, the default
> message "Erro ao sair da conta." is used.

## Session cleanup contract

`signOut(auth)` handles all Firebase session and token cleanup. After a successful `signOut`:

- Firebase `onAuthStateChanged` fires with `null`
- `useAuthState` hook propagates `null` to all consumers
- Subsequent Firestore and Storage operations are subject to Firebase security rules for unauthenticated users

No additional localStorage or cookie cleanup is required by this feature. App-level listener cleanup (e.g., `onSnapshot` unsubscribers) is the responsibility of the components that register them and is out of scope for this feature.

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

## Open questions

Nenhuma.
