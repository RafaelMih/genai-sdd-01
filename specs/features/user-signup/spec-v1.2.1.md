# Feature Spec: User Signup

Version: 1.2.1
Status: Approved

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
   - `undefined` (resolving) → render nothing; no flash of the signup form
   - `null` (unauthenticated) → render the form
   - `User` (authenticated) → redirect to `/dashboard` with `replace: true` (browser back will not return to /signup)
3. User fills: name, email, password, confirm password, and optionally phone
4. On form submit, client-side validation runs first (see Validation contract)
   - If validation fails: field-level errors shown inline; Firebase is NOT called
   - If validation passes:
     - any previously shown Firebase error message is cleared
     - the submit button is disabled and its label changes to "Criando conta…"
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

- AC1: Empty name shows inline validation error "Nome é obrigatório" below the name field
- AC2: Name shorter than 2 characters shows inline validation error "O nome deve ter pelo menos 2 caracteres" below the name field
- AC3: Name longer than 100 characters shows inline validation error "O nome deve ter no máximo 100 caracteres" below the name field
- AC4: Empty email shows inline validation error "E-mail é obrigatório" below the email field
- AC5: Email that does not match the validation pattern (see Validation contract) shows inline validation error "E-mail inválido" below the email field
- AC6: Empty password shows inline validation error "Senha é obrigatória" below the password field
- AC7: Password shorter than 6 characters shows inline validation error "A senha deve ter pelo menos 6 caracteres" below the password field
- AC8: Empty password confirmation shows inline validation error "Confirmação de senha é obrigatória" below the password confirmation field
- AC9: Password confirmation that does not match the password field shows inline validation error "As senhas não conferem" below the password confirmation field
- AC10: Firebase returns `auth/email-already-in-use` → shows "Este e-mail já está em uso." between the phone field and the submit button
- AC11: Firebase returns `auth/network-request-failed` → shows "Erro de conexão. Tente novamente." between the phone field and the submit button
- AC12: Firebase returns `auth/too-many-requests` → shows "Muitas tentativas. Tente mais tarde." between the phone field and the submit button
- AC13: Firebase returns `auth/operation-not-allowed` → shows "Operação não permitida." between the phone field and the submit button
- AC14: Firebase returns any other error code → shows "Erro ao criar conta." between the phone field and the submit button
- AC15: After submit (validation passed), the submit button is disabled and shows "Criando conta…" until Firebase responds; on Auth failure or Firestore write failure the button is re-enabled with label "Criar conta" and the error message is shown; on full success the page redirects to /dashboard
- AC16: Successful signup (both Auth and Firestore) navigates to `/dashboard` using `replace` (browser back from /dashboard will not return to /signup)
- AC17: Successful signup creates a Firestore document at `users/{uid}` containing the fields defined in the Firestore write contract
- AC18: A user already authenticated (detected via `onAuthStateChanged`) who opens `/signup` is redirected to `/dashboard` with `replace: true` before the form is rendered; pressing back from /dashboard will not return to /signup
- AC19: Phone field left empty does not produce any validation error; form submission proceeds normally
- AC20: A phone value that does not match the allowed format (see Validation contract) shows inline validation error "Telefone inválido" below the phone field
- AC21: If a valid phone is provided at signup, the Firestore document includes a `phone` field with the provided value; if phone is left empty, the `phone` field is omitted from the document entirely

## Validation contract

**Name**
- Required: non-empty string; failure message → "Nome é obrigatório" (AC1)
- Minimum length: ≥ 2 characters; failure message → "O nome deve ter pelo menos 2 caracteres" (AC2)
- Maximum length: ≤ 100 characters; failure message → "O nome deve ter no máximo 100 caracteres" (AC3)
- Validations run in order; first failure stops the chain

**Email**
- Required: non-empty string; failure message → "E-mail é obrigatório" (AC4)
- Format: must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; failure message → "E-mail inválido" (AC5)
- Validations run in order; first failure stops the chain

**Password**
- Required: non-empty string; failure message → "Senha é obrigatória" (AC6)
- Minimum length: ≥ 6 characters; failure message → "A senha deve ter pelo menos 6 caracteres" (AC7)
- Validations run in order; first failure stops the chain

**Confirm password**
- Required: non-empty string; failure message → "Confirmação de senha é obrigatória" (AC8)
- Must match the value of the password field at time of submit; failure message → "As senhas não conferem" (AC9)
- Validations run in order; first failure stops the chain

**Phone** (optional)
- If empty (blank string or absent): no validation runs; field passes silently (AC19)
- If non-empty: must match `/^\+?[\d\s()\-]{8,20}$/`; failure message → "Telefone inválido" (AC20)
- The regex allows an optional leading `+` followed by 8 to 20 characters from the set: digits,
  spaces, parentheses, and hyphens. The `{8,20}` quantifier applies to the portion after the
  optional `+`. Concrete examples:
  - `12345678` → valid (8 characters, no `+`)
  - `+12345678` → valid (`+` plus 8 digits)
  - `(11) 99999-9999` → valid (15 characters, no `+`)
  - `+55 (11) 99999-9999` → valid (`+` plus 18 characters)
  - `1234567` → invalid (only 7 characters after the optional `+`)
  - `+1234567` → invalid (`+` present but only 7 digits follow — fewer than 8 required by `{8,20}`)

**Trigger rules**
- Validation runs on form submit
- Validation also runs on individual field change, but only after the first submit attempt
  (react-hook-form `mode: "onSubmit"` with `reValidateMode: "onChange"` or equivalent)
- Change-triggered revalidation is UX behavior and does not have its own acceptance criteria;
  it must not break any existing AC

## Error messages contract

| Firebase error code            | Mensagem exibida ao usuário (pt-BR)     |
|--------------------------------|-----------------------------------------|
| `auth/email-already-in-use`    | Este e-mail já está em uso.             |
| `auth/invalid-email`           | E-mail inválido                         |
| `auth/network-request-failed`  | Erro de conexão. Tente novamente.       |
| `auth/too-many-requests`       | Muitas tentativas. Tente mais tarde.    |
| `auth/operation-not-allowed`   | Operação não permitida.                 |
| (todos os demais)              | Erro ao criar conta.                    |

> `auth/invalid-email` is a fallback: if client-side email validation is bypassed (e.g., via DevTools),
> Firebase may return this code. It must be handled but is not a duplicate of AC5.
>
> The error code is read from the `code` property (type: `string`) of the Firebase `AuthError`
> object thrown by `createUserWithEmailAndPassword`.

## Redirect contract

| Trigger                        | Source   | Destination  | Semantics | Browser back from destination |
|--------------------------------|----------|--------------|-----------|-------------------------------|
| Successful signup              | /signup  | /dashboard   | `replace` | Does not return to /signup    |
| User already authenticated     | /signup  | /dashboard   | `replace` | Does not return to /signup    |

Both redirects use the router's `navigate` function (not a hard page reload).

## Auth state contract

Auth state is observed via Firebase Auth `onAuthStateChanged`.

| State value | Meaning          | Signup page renders           |
|-------------|------------------|-------------------------------|
| `undefined` | Resolving        | Nothing (no flash of form)    |
| `null`      | Unauthenticated  | Signup form                   |
| `User`      | Authenticated    | Redirect to /dashboard        |

## UI state contract

| State             | Button label   | Button disabled | Firebase error message |
|-------------------|----------------|-----------------|------------------------|
| Default           | Criar conta    | No              | Hidden                 |
| Submitting        | Criando conta… | Yes             | Hidden (cleared)       |
| Error (Firebase)  | Criar conta    | No              | Visible (above button) |
| Success           | —              | —               | — (page redirects)     |

- Firebase error message placement: between the phone field and the submit button
- Firebase error message lifecycle: cleared at the start of each new submit attempt; not cleared by
  input changes between submits
- Inline validation errors: displayed immediately below their respective fields

## Firestore write contract

Collection: `users`
Document ID: `user.uid` (the authenticated Firebase user's UID, obtained from `auth.currentUser.uid`)

Fields written at signup:

| Field         | Type      | Value                                                     | Condition               |
|---------------|-----------|-----------------------------------------------------------|-------------------------|
| `displayName` | string    | value of the name field (as entered)                      | always                  |
| `email`       | string    | value of the email field                                  | always                  |
| `provider`    | string    | `"password"` (literal constant)                           | always                  |
| `createdAt`   | timestamp | `serverTimestamp()` from Firebase                         | always                  |
| `updatedAt`   | timestamp | `serverTimestamp()` from Firebase                         | always                  |
| `phone`       | string    | value of the phone field (as entered)                     | only if phone non-empty |

- The document is written using the client SDK (`setDoc`) immediately after successful `createUserWithEmailAndPassword`.
- This write is permitted by the security rules (users can create their own document).
- If phone is an empty string, the `phone` field is NOT included in the written document (AC21).

## Partial failure contract

If `createUserWithEmailAndPassword` succeeds but the Firestore `setDoc` fails:

1. Call `signOut(auth)` to restore a clean unauthenticated state.
2. Display the default error message: "Erro ao criar conta."
3. Re-enable the submit button with label "Criar conta".
4. Do NOT redirect.

The user may retry the full signup flow. On retry, the orphaned Firebase Auth user (from step 1) means
`createUserWithEmailAndPassword` will fail with `auth/email-already-in-use`, which surfaces as
"Este e-mail já está em uso." Cleanup of the orphaned auth user is out of scope.

## Session contract

Firebase Auth default session persistence (`local`) applies. Tokens persist across tabs and browser
restarts. No override is required by this feature.

## Dependencies

- `specs/decisions/ADR-001-use-firebase.md`
- `specs/technical/firestore-schema-v1.0.0.md` — defines the `users/{uid}` document structure
  (note: `phone` field is not yet in this schema; schema update is required before deployment)
- `specs/technical/security-rules-v1.0.0.md` — permits authenticated users to create their own document
- Firebase Auth SDK: `createUserWithEmailAndPassword`, `onAuthStateChanged`, `signOut`, `AuthError.code`
- Route `/dashboard`: must exist and be reachable before this feature is deployed

## Tests

| Caso de teste                                                         | Tipo        | ACs cobertos  |
|-----------------------------------------------------------------------|-------------|---------------|
| Validação de nome vazio                                               | Unit        | AC1           |
| Validação de nome com menos de 2 chars                                | Unit        | AC2           |
| Validação de nome com mais de 100 chars                               | Unit        | AC3           |
| Validação de email vazio                                              | Unit        | AC4           |
| Validação de email com formato inválido                               | Unit        | AC5           |
| Validação de senha vazia                                              | Unit        | AC6           |
| Validação de senha com menos de 6 chars                               | Unit        | AC7           |
| Validação de confirmação de senha vazia                               | Unit        | AC8           |
| Validação de confirmação diferente da senha                           | Unit        | AC9           |
| Telefone vazio não gera erro de validação                             | Unit        | AC19          |
| Telefone com formato inválido mostra "Telefone inválido"              | Unit        | AC20          |
| Erro auth/email-already-in-use                                        | Integration | AC10          |
| Erro auth/network-request-failed                                      | Integration | AC11          |
| Erro auth/too-many-requests                                           | Integration | AC12          |
| Erro auth/operation-not-allowed                                       | Integration | AC13          |
| Erro genérico Firebase                                                | Integration | AC14          |
| Estado de carregamento: botão desabilitado com label "Criando conta…" | Integration | AC15 (entry)  |
| Estado de carregamento: botão reabilitado com label "Criar conta"     | Integration | AC15 (exit)   |
| Signup bem-sucedido navega para /dashboard com replace                | Integration | AC16          |
| Signup com telefone: documento Firestore inclui campo phone           | Integration | AC17, AC21    |
| Signup sem telefone: documento Firestore omite campo phone            | Integration | AC17, AC21    |
| Usuário autenticado em /signup → redirect com replace sem render form | Integration | AC18          |

## Open questions

Nenhuma.
