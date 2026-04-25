# Context - auth

Spec: specs/features/auth/spec-v1.1.3.md

Contexto canonico curto para trabalho assistido por IA.
Use este arquivo antes de qualquer retrieval expandido.

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

## Active Acceptance Criteria

- AC1: When the user submits the login form with the email field empty, the page displays the inline validation error "E-mail é obrigatório" below the email field
- AC2: When the user submits the login form with an email value that does not match the validation pattern (see Validation contract), the page displays the inl...
- AC3: When the user submits the login form with the password field empty, the page displays the inline validation error "Senha é obrigatória" below the passwo...
- AC4: When the user submits the login form with a non-empty password shorter than 6 characters, the page displays "A senha deve ter pelo menos 6 caracteres" b...
- AC5: When the login request returns `auth/wrong-password`, `auth/user-not-found`, or `auth/invalid-credential`, the page displays "E-mail ou senha incorretos...
- AC6: When the login request returns `auth/user-disabled`, the page displays "Esta conta foi desativada. Entre em contato com o suporte." between the password...
- AC7: When the login request returns `auth/too-many-requests`, the page displays "Muitas tentativas. Tente novamente mais tarde." between the password field a...
- AC8: When the login request returns `auth/network-request-failed`, the page displays "Falha na conexão. Verifique sua internet e tente novamente." between th...
- AC9: When the login request returns any other Firebase error code, the page displays "Ocorreu um erro inesperado. Tente novamente." between the password fiel...
- AC10: When the login request succeeds, the `LoginForm` submit handler calls `navigate('/dashboard', { replace: true })` directly, without waiting for `onAuth...
- AC11: When the user submits the login form with valid client-side data, the submit button becomes disabled and displays "Entrando..." until Firebase responds...
- AC12: When an already-authenticated user opens `/login` and `onAuthStateChanged` resolves on page mount with `User`, the page redirects to `/dashboard` with ...

## Contracts

- Error messages contract: > `auth/user-not-found` e `auth/wrong-password` mapeiam para a mesma mensagem intencionalmente
- Validation contract: **Email**
- Redirect contract: Both redirects use the router's `navigate` function (not a hard page reload).
- Auth state contract: - Auth state is observed via Firebase Auth `onAuthStateChanged` on page mount only

## Target Files

- authSchema.ts
- authErrors.ts
- LoginForm.tsx
- LoginForm.tsx (isSubmitting)
- LoginPage.tsx
- useAuthState.ts
