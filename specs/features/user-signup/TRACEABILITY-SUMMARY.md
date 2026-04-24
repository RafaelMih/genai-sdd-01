# Traceability Summary - User Signup

Spec: specs/features/user-signup/spec-v1.2.1.md

## Acceptance Criteria Mapping

| AC   | Critério                                                                                   | Módulo(s)                            |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| AC1  | Nome vazio → "Nome é obrigatório"                                                          | `signupSchema.ts`                    |
| AC2  | Nome < 2 chars → "O nome deve ter pelo menos 2 caracteres"                                 | `signupSchema.ts`                    |
| AC3  | Nome > 100 chars → "O nome deve ter no máximo 100 caracteres"                              | `signupSchema.ts`                    |
| AC4  | E-mail vazio → "E-mail é obrigatório"                                                      | `signupSchema.ts`                    |
| AC5  | E-mail fora do padrão → "E-mail inválido"                                                  | `signupSchema.ts`                    |
| AC6  | Senha vazia → "Senha é obrigatória"                                                        | `signupSchema.ts`                    |
| AC7  | Senha < 6 chars → "A senha deve ter pelo menos 6 caracteres"                               | `signupSchema.ts`                    |
| AC8  | Confirmação vazia → "Confirmação de senha é obrigatória"                                   | `signupSchema.ts`                    |
| AC9  | Confirmação diferente → "As senhas não conferem"                                           | `signupSchema.ts`                    |
| AC10 | auth/email-already-in-use → "Este e-mail já está em uso."                                  | `signupErrors.ts` + `SignupForm.tsx` |
| AC11 | auth/network-request-failed → "Erro de conexão. Tente novamente."                          | `signupErrors.ts` + `SignupForm.tsx` |
| AC12 | auth/too-many-requests → "Muitas tentativas. Tente mais tarde."                            | `signupErrors.ts` + `SignupForm.tsx` |
| AC13 | auth/operation-not-allowed → "Operação não permitida."                                     | `signupErrors.ts` + `SignupForm.tsx` |
| AC14 | Outros erros Firebase → "Erro ao criar conta."                                             | `signupErrors.ts` + `SignupForm.tsx` |
| AC15 | Botão desabilitado com "Criando conta…" durante submit (entry)                             | `SignupForm.tsx` (`isSubmitting`)    |
| AC15 | Botão reabilitado com "Criar conta" após erro Firebase (exit)                              | `SignupForm.tsx`                     |
| AC16 | Signup bem-sucedido → navigate("/dashboard", { replace: true })                            | `SignupForm.tsx`                     |
| AC17 | Signup bem-sucedido → documento Firestore criado em users/{uid} com campos corretos        | `signupService.ts`                   |
| AC18 | Usuário autenticado em /signup → navigate("/dashboard", { replace: true }) sem render form | `SignupPage.tsx` + `useAuthState.ts` |
| AC19 | Telefone vazio não gera erro de validação                                                  | `signupSchema.ts`                    |
| AC20 | Telefone com formato inválido → "Telefone inválido"                                        | `signupSchema.ts`                    |
| AC21 | Telefone preenchido → campo `phone` no Firestore; vazio → campo omitido                    | `signupService.ts`                   |
