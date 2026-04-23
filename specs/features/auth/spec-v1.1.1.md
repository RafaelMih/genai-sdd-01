# Feature Spec: Auth

Version: 1.1.1
Status: Approved

## Objective

Allow users to sign in with an existing account using email and password.

## Scope

- Login page
- Form validation (client-side, before any Firebase call)
- Firebase Auth sign-in
- Redirect after success
- Friendly auth error messages (mapped per Firebase error code)
- Loading state during submission (entry and exit)
- Redirect already-authenticated users away from the login page

## Out of scope

- Google sign-in
- Password reset
- MFA
- User registration (accounts are provisioned externally or via a separate feature)
- Route guard for /dashboard (must exist before this feature is deployed; not implemented here)
- Session persistence override (Firebase Auth default `local` persistence applies)

## User flow

1. User opens the login page
2. `onAuthStateChanged` fires; if the user is already authenticated, redirect immediately to
   `/dashboard` with `replace: true`; if unauthenticated, render the form; while the result is
   pending, render nothing (no flash of login form)
3. User enters email and password
4. On form submit, client-side validation runs first (see Validation contract)
5. If validation fails, field-level errors are shown inline and Firebase is NOT called
6. If validation passes, the submit button is disabled and its label changes to "Entrando…"
   (the loading indicator); no spinner component is required
7. System calls Firebase Auth `signInWithEmailAndPassword`
8. On success: redirect to `/dashboard`; the form is not reset because the page is unmounted
9. On failure: show the mapped error message (see Error messages contract); the submit button
   is re-enabled and its label returns to "Entrar"

## Acceptance criteria

- AC1: Empty email shows inline validation error "E-mail é obrigatório"
- AC2: Email that does not match the validation pattern (see Validation contract) shows
  inline validation error "E-mail inválido"
- AC3: Empty password shows inline validation error "Senha é obrigatória"
- AC4: Password that passes the empty check but has fewer than 6 characters shows
  "A senha deve ter pelo menos 6 caracteres"
- AC5: Firebase returns auth/wrong-password, auth/user-not-found, or auth/invalid-credential →
  shows "E-mail ou senha incorretos."
- AC6: Firebase returns auth/user-disabled →
  shows "Esta conta foi desativada. Entre em contato com o suporte."
- AC7: Firebase returns auth/too-many-requests →
  shows "Muitas tentativas. Tente novamente mais tarde."
- AC8: Firebase returns auth/network-request-failed →
  shows "Falha na conexão. Verifique sua internet e tente novamente."
- AC9: Firebase returns any other error code →
  shows "Ocorreu um erro inesperado. Tente novamente."
- AC10: Firebase sign-in succeeds → browser navigates to /dashboard
- AC11: After submit (validation passed), the button is disabled and shows "Entrando…" until
  Firebase responds; on any response (success or failure) the loading state ends:
  on failure the button is re-enabled with label "Entrar"; on success the page redirects
- AC12: A user already authenticated (detected via `onAuthStateChanged`) who opens /login is
  redirected to /dashboard before the form is rendered

## Error messages contract

| Firebase error code          | Mensagem exibida ao usuário (pt-BR)                              |
|------------------------------|------------------------------------------------------------------|
| auth/user-not-found          | E-mail ou senha incorretos.                                      |
| auth/wrong-password          | E-mail ou senha incorretos.                                      |
| auth/invalid-credential      | E-mail ou senha incorretos.                                      |
| auth/invalid-email           | E-mail inválido                                                  |
| auth/user-disabled           | Esta conta foi desativada. Entre em contato com o suporte.       |
| auth/too-many-requests       | Muitas tentativas. Tente novamente mais tarde.                   |
| auth/network-request-failed  | Falha na conexão. Verifique sua internet e tente novamente.      |
| (todos os demais)            | Ocorreu um erro inesperado. Tente novamente.                     |

> `auth/user-not-found` e `auth/wrong-password` mapeiam para a mesma mensagem intencionalmente
> para evitar enumeração de contas.
>
> `auth/invalid-email` is a fallback only: if client-side validation is bypassed (e.g., via
> DevTools) this code may be returned by Firebase and must be handled. It must not be treated
> as a duplicate of AC2, which covers client-side validation.

## Validation contract

**Email**
- Required: non-empty string; failure message → "E-mail é obrigatório" (AC1)
- Format: must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; failure message → "E-mail inválido" (AC2)
- Validations run in order; first failure stops the chain

**Password**
- Required: non-empty string; failure message → "Senha é obrigatória" (AC3)
- Minimum length: ≥ 6 characters; failure message → "A senha deve ter pelo menos 6 caracteres" (AC4)
- Validations run in order; first failure stops the chain

**Trigger rules**
- Validation runs on form submit
- Validation also runs on individual field blur, but only after the first submit attempt
  (standard react-hook-form `mode: "onSubmit"` + `reValidateMode: "onChange"` or equivalent)
- Blur-triggered validation is a UX behavior and does not have its own acceptance criteria;
  it must not break any existing AC

## Redirect contract

- Path after successful sign-in: `/dashboard`
- Path for already-authenticated users on `/login`: `/dashboard` (with `replace: true`)
- Redirect uses the router's `navigate` function, not a hard reload

## Auth state contract

- Auth state is observed via Firebase Auth `onAuthStateChanged`
- While the initial state is resolving (`undefined`), the login page renders nothing
- Once resolved as `null` (unauthenticated), the form is rendered
- Once resolved as a `User` object (authenticated), the redirect fires

## Session contract

- Firebase Auth default session persistence (`local`) applies
- Tokens persist across tabs and browser restarts
- No override is required by this feature

## Account provisioning

User registration is out of scope. Accounts must be pre-created via Firebase console, Admin
SDK, or a separate sign-up feature. This spec does not define sign-up behavior.

## Firestore behavior

This feature does not create or modify any Firestore document. Authentication is handled
entirely via the Firebase Auth client SDK. User profile documents (`users/{uid}`) are the
responsibility of a separate onboarding or sign-up feature.

## Dependencies

- specs/decisions/ADR-001-use-firebase.md

## Tests

| Caso de teste                                        | Tipo        | ACs cobertos |
|------------------------------------------------------|-------------|--------------|
| Validação de email vazio                             | Unit        | AC1          |
| Validação de email que não corresponde ao padrão     | Unit        | AC2          |
| Validação de senha vazia                             | Unit        | AC3          |
| Validação de senha com menos de 6 caracteres         | Unit        | AC4          |
| Erro de credenciais inválidas (wrong-password)       | Integration | AC5          |
| Erro de conta desativada                             | Integration | AC6          |
| Erro de muitas tentativas                            | Integration | AC7          |
| Erro de rede                                         | Integration | AC8          |
| Erro genérico do Firebase                            | Integration | AC9          |
| Login bem-sucedido redireciona para /dashboard       | Integration | AC10         |
| Estado de carregamento: botão desabilitado e label   | Integration | AC11 (entry) |
| Estado de carregamento encerra após erro Firebase    | Integration | AC11 (exit)  |
| Redirecionamento de usuário já autenticado           | Integration | AC12         |

## Open questions

Nenhuma.
