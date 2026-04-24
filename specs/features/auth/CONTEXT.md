# Context - auth

Spec: specs/features/auth/spec-v1.1.3.md

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

## Objective

Allow users to sign in with an existing account using email and password.

## Scope

- Login page
- Form validation (client-side, before any Firebase call)
- Firebase Auth sign-in
- Redirect after successful sign-in
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
2. `onAuthStateChanged` fires on page mount:
   - `undefined` (resolving) -> render nothing; no flash of the login form
   - `null` (unauthenticated) -> render the form
   - `User` (authenticated) -> redirect to `/dashboard` with `replace: true` (browser back will not return to /login)
   - Note: this observer handles only the page-mount case (AC12); it does NOT trigger the post-login redirect.
3. User enters email and password
4. On form submit, client-side validation runs first (see Validation contract)
5. If validation fails, field-level errors are shown inline and Firebase is NOT called
6. If validation passes:
   - any previously shown Firebase error message is cleared
   - the submit button is disabled and its label changes to "Entrando..."
7. System calls Firebase Auth `signInWithEmailAndPassword`
8. On success: the form's submit handler calls `navigate('/dashboard', { replace: true })` directly;
   this is a direct router call in `LoginForm`, not a side-effect of `onAuthStateChanged`;
   the form is not reset because the page is unmounted; browser back from /dashboard will not return to /login
9. On failure:
   - the Firebase error is mapped to a message (see Error messages contract)
   - the message is displayed below the password field and above the submit button
   - the submit button is re-enabled and its label returns to "Entrar"

## Acceptance criteria

- AC1: When the user submits the login form with the email field empty, the page displays the inline validation error "E-mail é obrigatório" below the email field
- AC2: When the user submits the login form with an email value that does not match the validation pattern (see Validation contract), the page displays the inline validation error "E-mail inválido" below the email field
- AC3: When the user submits the login form with the password field empty, the page displays the inline validation error "Senha é obrigatória" below the password field
- AC4: When the user submits the login form with a non-empty password shorter than 6 characters, the page displays "A senha deve ter pelo menos 6 caracteres" below the password field
- AC5: When the login request returns `auth/wrong-password`, `auth/user-not-found`, or `auth/invalid-credential`, the page displays "E-mail ou senha incorretos." between the password field and the submit button
- AC6: When the login request returns `auth/user-disabled`, the page displays "Esta conta foi desativada. Entre em contato com o suporte." between the password field and the submit button
- AC7: When the login request returns `auth/too-many-requests`, the page displays "Muitas tentativas. Tente novamente mais tarde." between the password field and the submit button
- AC8: When the login request returns `auth/network-request-failed`, the page displays "Falha na conexão. Verifique sua internet e tente novamente." between the password field and the submit button
- AC9: When the login request returns any other Firebase error code, the page displays "Ocorreu um erro inesperado. Tente novamente." between the password field and the submit button
- AC10: When the login request succeeds, the `LoginForm` submit handler calls `navigate('/dashboard', { replace: true })` directly, without waiting for `onAuthStateChanged`, and browser back from `/dashboard` does not return to `/login`
- AC11: When the user submits the login form with valid client-side data, the submit button becomes disabled and displays "Entrando..." until Firebase responds; if Firebase returns an error, the button is re-enabled with label "Entrar" and the Firebase error message remains visible; if Firebase succeeds, the redirect defined in AC10 is executed
- AC12: When an already-authenticated user opens `/login` and `onAuthStateChanged` resolves on page mount with `User`, the page redirects to `/dashboard` with `replace: true` before rendering the login form, and browser back from `/dashboard` does not return to `/login`

## Dependencies

- specs/decisions/ADR-001-use-firebase.md
- Firebase Auth SDK: `signInWithEmailAndPassword`, `onAuthStateChanged`, `AuthError.code`
- Route /dashboard: must exist and be reachable before this feature is deployed

## Tests

| Caso de teste                                                 | Tipo        | ACs cobertos |
| ------------------------------------------------------------- | ----------- | ------------ |
| Validação de email vazio                                      | Unit        | AC1          |
| Validação de email que não corresponde ao padrão              | Unit        | AC2          |
| Validação de senha vazia                                      | Unit        | AC3          |
| Validação de senha com menos de 6 caracteres                  | Unit        | AC4          |
| Erro de credenciais inválidas (wrong-password)                | Integration | AC5          |
| Erro de conta desativada                                      | Integration | AC6          |
| Erro de muitas tentativas                                     | Integration | AC7          |
| Erro de rede                                                  | Integration | AC8          |
| Erro genérico do Firebase                                     | Integration | AC9          |
| Login bem-sucedido: submit handler chama navigate diretamente | Integration | AC10         |
| Estado de carregamento: botão desabilitado com label          | Integration | AC11 (entry) |
| Estado de carregamento encerra após erro Firebase             | Integration | AC11 (exit)  |
| Redirecionamento de usuário já autenticado com replace        | Integration | AC12         |
