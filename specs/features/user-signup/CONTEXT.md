# Context - user-signup

Spec: specs/features/user-signup/spec-v1.2.1.md

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

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

## Out of scope

- Google sign-in
- Password reset
- MFA
- Email verification
- User profile editing
- Subscription or billing setup
- Route guard for `/dashboard` (must exist before this feature is deployed; not implemented here)
- Session persistence override (Firebase Auth default `local` persistence applies)
- Cleanup of orphaned Firebase Auth users after partial failure
- Server-side phone number verification (e.g. OTP/SMS)

## User flow

1. User opens `/signup`
2. `onAuthStateChanged` fires:
   - `undefined` (resolving) -> render nothing; no flash of the signup form
   - `null` (unauthenticated) -> render the form
   - `User` (authenticated) -> redirect to `/dashboard` with `replace: true` (browser back will not return to /signup)
3. User fills: name, email, password, confirm password, and optionally phone
4. On form submit, client-side validation runs first (see Validation contract)
   - If validation fails: field-level errors shown inline; Firebase is NOT called
   - If validation passes:
     - any previously shown Firebase error message is cleared
     - the submit button is disabled and its label changes to "Criando conta..."
5. System calls `createUserWithEmailAndPassword(auth, email, password)`
6. If Firebase Auth succeeds: system calls `setDoc` to create the user profile document
   (see Firestore write contract; phone is included only if provided)
7. If both steps succeed: navigate to `/dashboard` with `replace: true`; browser back from /dashboard will not return to /signup
8. If Firebase Auth fails:
   - map the error code to a message (see Error messages contract)
   - display the message between the phone field and the submit button
   - re-enable the submit button with label "Criar conta"
9. If Firebase Auth succeeds but Firestore write fails:
   - call `signOut(auth)` to restore a clean unauthenticated state
   - display the default error message "Erro ao criar conta."
   - re-enable the submit button with label "Criar conta"
   - the user is NOT redirected

## Acceptance criteria

- AC1: When the user submits the signup form with the name field empty, the page displays the inline validation error "Nome é obrigatório" below the name field
- AC2: When the user submits the signup form with a name shorter than 2 characters, the page displays the inline validation error "O nome deve ter pelo menos 2 caracteres" below the name field
- AC3: When the user submits the signup form with a name longer than 100 characters, the page displays the inline validation error "O nome deve ter no máximo 100 caracteres" below the name field
- AC4: When the user submits the signup form with the email field empty, the page displays the inline validation error "E-mail é obrigatório" below the email field
- AC5: When the user submits the signup form with an email value that does not match the validation pattern (see Validation contract), the page displays the inline validation error "E-mail inválido" below the email field
- AC6: When the user submits the signup form with the password field empty, the page displays the inline validation error "Senha é obrigatória" below the password field
- AC7: When the user submits the signup form with a password shorter than 6 characters, the page displays the inline validation error "A senha deve ter pelo menos 6 caracteres" below the password field
- AC8: When the user submits the signup form with the password confirmation field empty, the page displays the inline validation error "Confirmação de senha é obrigatória" below the password confirmation field
- AC9: When the user submits the signup form with a password confirmation value different from the password field, the page displays the inline validation error "As senhas não conferem" below the password confirmation field
- AC10: When the signup request returns `auth/email-already-in-use`, the page displays "Este e-mail já está em uso." between the phone field and the submit button
- AC11: When the signup request returns `auth/network-request-failed`, the page displays "Erro de conexão. Tente novamente." between the phone field and the submit button
- AC12: When the signup request returns `auth/too-many-requests`, the page displays "Muitas tentativas. Tente mais tarde." between the phone field and the submit button
- AC13: When the signup request returns `auth/operation-not-allowed`, the page displays "Operação não permitida." between the phone field and the submit button
- AC14: When the signup request returns any other Firebase error code, the page displays "Erro ao criar conta." between the phone field and the submit button
- AC15: When the user submits the signup form with valid client-side data, the submit button becomes disabled and displays "Criando conta..." until Firebase responds; if Firebase Auth or the Firestore write fails, the button is re-enabled with label "Criar conta" and the error message remains visible; if both operations succeed, the redirect defined in AC16 is executed
- AC16: When Firebase Auth and the Firestore write both succeed, the page navigates to `/dashboard` with `replace`, and browser back from `/dashboard` does not return to `/signup`
- AC17: When Firebase Auth succeeds and the Firestore write is executed, the system creates a document at `users/{uid}` containing the fields defined in the Firestore write contract
- AC18: When an already-authenticated user opens `/signup` and `onAuthStateChanged` resolves with `User`, the page redirects to `/dashboard` with `replace: true` before rendering the signup form, and browser back from `/dashboard` does not return to `/signup`
- AC19: When the user submits the signup form with the phone field empty, the form displays no validation error for `phone` and the submission continues normally
- AC20: When the user submits the signup form with a non-empty phone value that does not match the allowed format (see Validation contract), the page displays the inline validation error "Telefone inválido" below the phone field
- AC21: When the signup flow writes the user profile to Firestore with a valid non-empty phone value, the system creates `users/{uid}` with a `phone` field containing that value; when the phone field is empty, the system creates `users/{uid}` without a `phone` field

## Dependencies

- `specs/decisions/ADR-001-use-firebase.md`
- `specs/technical/firestore-schema-v1.0.0.md` -> defines the `users/{uid}` document structure
- `specs/technical/security-rules-v1.0.0.md` -> permits authenticated users to create their own document
- Firebase Auth SDK: `createUserWithEmailAndPassword`, `onAuthStateChanged`, `signOut`, `AuthError.code`
- Route `/dashboard`: must exist and be reachable before this feature is deployed

## Tests

| Caso de teste                                                           | Tipo        | ACs cobertos |
| ----------------------------------------------------------------------- | ----------- | ------------ |
| Validação de nome vazio                                                 | Unit        | AC1          |
| Validação de nome com menos de 2 chars                                  | Unit        | AC2          |
| Validação de nome com mais de 100 chars                                 | Unit        | AC3          |
| Validação de email vazio                                                | Unit        | AC4          |
| Validação de email com formato inválido                                 | Unit        | AC5          |
| Validação de senha vazia                                                | Unit        | AC6          |
| Validação de senha com menos de 6 chars                                 | Unit        | AC7          |
| Validação de confirmação de senha vazia                                 | Unit        | AC8          |
| Validação de confirmação diferente da senha                             | Unit        | AC9          |
| Telefone vazio não gera erro de validação                               | Unit        | AC19         |
| Telefone com formato inválido mostra "Telefone inválido"                | Unit        | AC20         |
| Erro auth/email-already-in-use                                          | Integration | AC10         |
| Erro auth/network-request-failed                                        | Integration | AC11         |
| Erro auth/too-many-requests                                             | Integration | AC12         |
| Erro auth/operation-not-allowed                                         | Integration | AC13         |
| Erro genérico Firebase                                                  | Integration | AC14         |
| Estado de carregamento: botão desabilitado com label "Criando conta..." | Integration | AC15 (entry) |
| Estado de carregamento: botão reabilitado com label "Criar conta"       | Integration | AC15 (exit)  |
| Signup bem-sucedido navega para /dashboard com replace                  | Integration | AC16         |
| Signup com telefone: documento Firestore inclui campo phone             | Integration | AC17, AC21   |
| Signup sem telefone: documento Firestore omite campo phone              | Integration | AC17, AC21   |
| Usuário autenticado em /signup -> redirect com replace sem render form  | Integration | AC18         |
