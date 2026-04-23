# Traceability - Auth

Spec: specs/features/auth/spec-v1.1.2.md

## Acceptance Criteria Mapping

| AC   | Critério                                                                          | Módulo(s)                                         | Caso(s) de teste                                                          |
|------|-----------------------------------------------------------------------------------|---------------------------------------------------|---------------------------------------------------------------------------|
| AC1  | Email vazio → "E-mail é obrigatório"                                             | `authSchema.ts`                                   | `authSchema.test.ts` — "empty email shows…"                               |
| AC2  | Email fora do padrão → "E-mail inválido"                                         | `authSchema.ts`                                   | `authSchema.test.ts` — "malformed email shows…"                           |
| AC3  | Senha vazia → "Senha é obrigatória"                                              | `authSchema.ts`                                   | `authSchema.test.ts` — "empty password shows…"                            |
| AC4  | Senha < 6 chars → mensagem de comprimento                                        | `authSchema.ts`                                   | `authSchema.test.ts` — "password shorter than 6 chars…"                   |
| AC5  | auth/wrong-password → "E-mail ou senha incorretos."                              | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "wrong-password shows…"                            |
| AC5  | auth/user-not-found → "E-mail ou senha incorretos."                              | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "user-not-found shows…"                            |
| AC5  | auth/invalid-credential → "E-mail ou senha incorretos."                          | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "invalid-credential shows…"                        |
| AC6  | auth/user-disabled → mensagem de conta desativada                                | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "disabled account shows…"                          |
| AC7  | auth/too-many-requests → mensagem de rate limit                                  | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "too many requests shows…"                         |
| AC8  | auth/network-request-failed → mensagem de conexão                                | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "network error shows…"                             |
| AC9  | Outros erros Firebase → "Ocorreu um erro inesperado."                            | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "unknown Firebase error shows…"                    |
|  —   | auth/invalid-email fallback (bypass client-side)                                 | `authErrors.ts` + `LoginForm.tsx`                 | `LoginForm.test.tsx` — "auth/invalid-email fallback shows…"               |
| AC10 | Login bem-sucedido → navigate("/dashboard", { replace: true })                  | `LoginForm.tsx`                                   | `LoginForm.test.tsx` — "successful login navigates to /dashboard…"        |
| AC11 | Botão desabilitado e label "Entrando…" durante submit (entry)                   | `LoginForm.tsx` (`isSubmitting`)                  | `LoginForm.test.tsx` — "submit button disabled and shows loading text…"   |
| AC11 | Botão reabilitado com label "Entrar" após erro Firebase (exit)                  | `LoginForm.tsx`                                   | `LoginForm.test.tsx` — "submit button re-enabled with label Entrar…"      |
| AC12 | Usuário autenticado em /login → navigate("/dashboard", { replace: true })       | `LoginPage.tsx` + `useAuthState.ts`               | `LoginPage.test.tsx` — "already-authenticated user is redirected…"        |
