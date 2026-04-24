# Traceability - User Signup

Spec: specs/features/user-signup/spec-v1.2.1.md

## Acceptance Criteria Mapping

| AC   | Critério                                                                                   | Módulo(s)                            | Caso(s) de teste                                                                                   |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| AC1  | Nome vazio → "Nome é obrigatório"                                                          | `signupSchema.ts`                    | `signupSchema.test.ts` — "empty name shows…"                                                       |
| AC2  | Nome < 2 chars → "O nome deve ter pelo menos 2 caracteres"                                 | `signupSchema.ts`                    | `signupSchema.test.ts` — "name shorter than 2 chars…"                                              |
| AC3  | Nome > 100 chars → "O nome deve ter no máximo 100 caracteres"                              | `signupSchema.ts`                    | `signupSchema.test.ts` — "name longer than 100 chars…"                                             |
| AC4  | E-mail vazio → "E-mail é obrigatório"                                                      | `signupSchema.ts`                    | `signupSchema.test.ts` — "empty email shows…"                                                      |
| AC5  | E-mail fora do padrão → "E-mail inválido"                                                  | `signupSchema.ts`                    | `signupSchema.test.ts` — "malformed email shows…"                                                  |
| AC6  | Senha vazia → "Senha é obrigatória"                                                        | `signupSchema.ts`                    | `signupSchema.test.ts` — "empty password shows…"                                                   |
| AC7  | Senha < 6 chars → "A senha deve ter pelo menos 6 caracteres"                               | `signupSchema.ts`                    | `signupSchema.test.ts` — "password shorter than 6 chars…"                                          |
| AC8  | Confirmação vazia → "Confirmação de senha é obrigatória"                                   | `signupSchema.ts`                    | `signupSchema.test.ts` — "empty confirmPassword shows…"                                            |
| AC9  | Confirmação diferente → "As senhas não conferem"                                           | `signupSchema.ts`                    | `signupSchema.test.ts` — "mismatched confirmPassword shows…"                                       |
| AC10 | auth/email-already-in-use → "Este e-mail já está em uso."                                  | `signupErrors.ts` + `SignupForm.tsx` | `SignupForm.test.tsx` — "email-already-in-use shows…"                                              |
| AC11 | auth/network-request-failed → "Erro de conexão. Tente novamente."                          | `signupErrors.ts` + `SignupForm.tsx` | `SignupForm.test.tsx` — "network-request-failed shows…"                                            |
| AC12 | auth/too-many-requests → "Muitas tentativas. Tente mais tarde."                            | `signupErrors.ts` + `SignupForm.tsx` | `SignupForm.test.tsx` — "too-many-requests shows…"                                                 |
| AC13 | auth/operation-not-allowed → "Operação não permitida."                                     | `signupErrors.ts` + `SignupForm.tsx` | `SignupForm.test.tsx` — "operation-not-allowed shows…"                                             |
| AC14 | Outros erros Firebase → "Erro ao criar conta."                                             | `signupErrors.ts` + `SignupForm.tsx` | `SignupForm.test.tsx` — "unknown error shows…"                                                     |
| AC15 | Botão desabilitado com "Criando conta…" durante submit (entry)                             | `SignupForm.tsx` (`isSubmitting`)    | `SignupForm.test.tsx` — "submit button disabled and shows Criando conta…"                          |
| AC15 | Botão reabilitado com "Criar conta" após erro Firebase (exit)                              | `SignupForm.tsx`                     | `SignupForm.test.tsx` — "submit button re-enabled with label Criar conta…"                         |
| AC16 | Signup bem-sucedido → navigate("/dashboard", { replace: true })                            | `SignupForm.tsx`                     | `SignupForm.test.tsx` — "successful signup navigates to /dashboard with replace"                   |
| AC17 | Signup bem-sucedido → documento Firestore criado em users/{uid} com campos corretos        | `signupService.ts`                   | `signupService.test.ts` — "creates Firestore document at users/{uid}…"                             |
| AC18 | Usuário autenticado em /signup → navigate("/dashboard", { replace: true }) sem render form | `SignupPage.tsx` + `useAuthState.ts` | `SignupPage.test.tsx` — "already-authenticated user is redirected…"                                |
| AC19 | Telefone vazio não gera erro de validação                                                  | `signupSchema.ts`                    | `signupSchema.test.ts` — "empty phone string passes…" / "absent phone passes…"                     |
| AC20 | Telefone com formato inválido → "Telefone inválido"                                        | `signupSchema.ts`                    | `signupSchema.test.ts` — "phone with 7 characters shows…"                                          |
| AC21 | Telefone preenchido → campo `phone` no Firestore; vazio → campo omitido                    | `signupService.ts`                   | `signupService.test.ts` — "creates Firestore document with phone field…" / "…without phone field…" |
