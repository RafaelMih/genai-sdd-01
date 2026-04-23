# Traceability - Auth

Spec: specs/features/auth/spec-v1.1.0.md

## Acceptance Criteria Mapping

| AC  | Critério                                                        | Módulo(s)                                            | Teste                                                    |
|-----|-----------------------------------------------------------------|------------------------------------------------------|----------------------------------------------------------|
| AC1 | Email vazio → "E-mail é obrigatório"                           | `authSchema.ts`                                      | `authSchema.test.ts` — "empty email shows…"              |
| AC2 | Email malformado → "E-mail inválido"                           | `authSchema.ts`                                      | `authSchema.test.ts` — "malformed email shows…"          |
| AC3 | Senha vazia → "Senha é obrigatória"                            | `authSchema.ts`                                      | `authSchema.test.ts` — "empty password shows…"           |
| AC4 | Senha < 6 chars → mensagem de comprimento                      | `authSchema.ts`                                      | `authSchema.test.ts` — "password shorter than 6 chars…"  |
| AC5 | Credenciais erradas → "E-mail ou senha incorretos."            | `authErrors.ts` + `LoginForm.tsx`                    | `LoginForm.test.tsx` — "wrong credentials show…"         |
| AC6 | Conta desativada → mensagem de conta desativada                | `authErrors.ts` + `LoginForm.tsx`                    | `LoginForm.test.tsx` — "disabled account shows…"         |
| AC7 | Muitas tentativas → mensagem de rate limit                     | `authErrors.ts` + `LoginForm.tsx`                    | `LoginForm.test.tsx` — "too many requests shows…"        |
| AC8 | Erro de rede → mensagem de conexão                             | `authErrors.ts` + `LoginForm.tsx`                    | `LoginForm.test.tsx` — "network error shows…"            |
| AC9 | Erro genérico Firebase → "Ocorreu um erro inesperado."         | `authErrors.ts` + `LoginForm.tsx`                    | `LoginForm.test.tsx` — "unknown Firebase error shows…"   |
| AC10| Login bem-sucedido → redirect /dashboard                       | `LoginForm.tsx` (navigate)                           | `LoginForm.test.tsx` — "successful login redirects…"     |
| AC11| Botão desabilitado e indicador de carregamento durante submit  | `LoginForm.tsx` (isSubmitting)                       | `LoginForm.test.tsx` — "submit button disabled…"         |
| AC12| Usuário autenticado em /login → redirect /dashboard            | `LoginPage.tsx` + `useAuthState.ts`                  | `LoginPage.test.tsx` — "already-authenticated user…"     |
