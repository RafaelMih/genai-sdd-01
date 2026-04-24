# Traceability Summary - Auth

Spec: specs/features/auth/spec-v1.1.3.md

## Acceptance Criteria Mapping

| AC   | Critério                                                                                                                         | Módulo(s)                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| AC1  | Email vazio → "E-mail é obrigatório"                                                                                             | `authSchema.ts`                     |
| AC2  | Email fora do padrão → "E-mail inválido"                                                                                         | `authSchema.ts`                     |
| AC3  | Senha vazia → "Senha é obrigatória"                                                                                              | `authSchema.ts`                     |
| AC4  | Senha < 6 chars → mensagem de comprimento                                                                                        | `authSchema.ts`                     |
| AC5  | auth/wrong-password → "E-mail ou senha incorretos."                                                                              | `authErrors.ts` + `LoginForm.tsx`   |
| AC5  | auth/user-not-found → "E-mail ou senha incorretos."                                                                              | `authErrors.ts` + `LoginForm.tsx`   |
| AC5  | auth/invalid-credential → "E-mail ou senha incorretos."                                                                          | `authErrors.ts` + `LoginForm.tsx`   |
| AC6  | auth/user-disabled → mensagem de conta desativada                                                                                | `authErrors.ts` + `LoginForm.tsx`   |
| AC7  | auth/too-many-requests → mensagem de rate limit                                                                                  | `authErrors.ts` + `LoginForm.tsx`   |
| AC8  | auth/network-request-failed → mensagem de conexão                                                                                | `authErrors.ts` + `LoginForm.tsx`   |
| AC9  | Outros erros Firebase → "Ocorreu um erro inesperado."                                                                            | `authErrors.ts` + `LoginForm.tsx`   |
| —    | auth/invalid-email fallback (bypass client-side)                                                                                 | `authErrors.ts` + `LoginForm.tsx`   |
| AC10 | Login bem-sucedido → submit handler chama `navigate("/dashboard", { replace: true })` diretamente (não via `onAuthStateChanged`) | `LoginForm.tsx`                     |
| AC11 | Botão desabilitado e label "Entrando…" durante submit (entry)                                                                    | `LoginForm.tsx` (`isSubmitting`)    |
| AC11 | Botão reabilitado com label "Entrar" após erro Firebase (exit)                                                                   | `LoginForm.tsx`                     |
| AC12 | Usuário autenticado em /login → navigate("/dashboard", { replace: true }) sem renderizar o formulário                            | `LoginPage.tsx` + `useAuthState.ts` |
