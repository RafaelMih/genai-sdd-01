# Context - user-signup

Spec: specs/features/user-signup/spec-v1.2.1.md

Contexto canonico curto para trabalho assistido por IA.
Use este arquivo antes de qualquer retrieval expandido.

## Objective

Allow a new user to create an account using name, email, and password.
An optional phone number may be provided and is persisted in the user profile.

## Scope

- Signup page at `/signup`
- Signup form validation (client-side, before any Firebase call)
- Firebase Auth user creation via `createUserWithEmailAndPassword`
- Firestore user profile document creation after successful auth
- Redirect after successful signup
- Friendly signup error messages (mapped per Firebase error code)
- Loading state during submission
- Redirect already-authenticated users away from the signup page
- Optional phone field with format validation and Firestore persistence

## Active Acceptance Criteria

- AC1: When the user submits the signup form with the name field empty, the page displays the inline validation error "Nome é obrigatório" below the name field
- AC2: When the user submits the signup form with a name shorter than 2 characters, the page displays the inline validation error "O nome deve ter pelo menos 2...
- AC3: When the user submits the signup form with a name longer than 100 characters, the page displays the inline validation error "O nome deve ter no máximo 1...
- AC4: When the user submits the signup form with the email field empty, the page displays the inline validation error "E-mail é obrigatório" below the email f...
- AC5: When the user submits the signup form with an email value that does not match the validation pattern (see Validation contract), the page displays the in...
- AC6: When the user submits the signup form with the password field empty, the page displays the inline validation error "Senha é obrigatória" below the passw...
- AC7: When the user submits the signup form with a password shorter than 6 characters, the page displays the inline validation error "A senha deve ter pelo me...
- AC8: When the user submits the signup form with the password confirmation field empty, the page displays the inline validation error "Confirmação de senha é ...
- AC9: When the user submits the signup form with a password confirmation value different from the password field, the page displays the inline validation erro...
- AC10: When the signup request returns `auth/email-already-in-use`, the page displays "Este e-mail já está em uso." between the phone field and the submit button
- AC11: When the signup request returns `auth/network-request-failed`, the page displays "Erro de conexão. Tente novamente." between the phone field and the su...
- AC12: When the signup request returns `auth/too-many-requests`, the page displays "Muitas tentativas. Tente mais tarde." between the phone field and the subm...
- AC13: When the signup request returns `auth/operation-not-allowed`, the page displays "Operação não permitida." between the phone field and the submit button
- AC14: When the signup request returns any other Firebase error code, the page displays "Erro ao criar conta." between the phone field and the submit button
- AC15: When the user submits the signup form with valid client-side data, the submit button becomes disabled and displays "Criando conta..." until Firebase re...
- AC16: When Firebase Auth and the Firestore write both succeed, the page navigates to `/dashboard` with `replace`, and browser back from `/dashboard` does not...
- AC17: When Firebase Auth succeeds and the Firestore write is executed, the system creates a document at `users/{uid}` containing the fields defined in the Fi...
- AC18: When an already-authenticated user opens `/signup` and `onAuthStateChanged` resolves with `User`, the page redirects to `/dashboard` with `replace: tru...
- AC19: When the user submits the signup form with the phone field empty, the form displays no validation error for `phone` and the submission continues normally
- AC20: When the user submits the signup form with a non-empty phone value that does not match the allowed format (see Validation contract), the page displays ...
- AC21: When the signup flow writes the user profile to Firestore with a valid non-empty phone value, the system creates `users/{uid}` with a `phone` field con...

## Contracts

- Validation contract: **Name**
- Error messages contract: > `auth/invalid-email` is a fallback: if client-side email validation is bypassed (e.g., via DevTools),
- Redirect contract: Both redirects use the router's `navigate` function (not a hard page reload).
- Auth state contract: Auth state is observed via Firebase Auth `onAuthStateChanged`.

## Target Files

- signupSchema.ts
- signupErrors.ts
- SignupForm.tsx
- SignupForm.tsx (isSubmitting)
- signupService.ts
- SignupPage.tsx
- useAuthState.ts
