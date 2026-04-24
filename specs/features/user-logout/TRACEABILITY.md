# Traceability - User Logout

Spec: specs/features/user-logout/spec-v1.1.0.md

## Acceptance Criteria Mapping

| AC  | Critério                                                                                           | Módulo(s)                              | Caso(s) de teste                                                                 |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| AC1 | Clicar no botão chama `signOut(auth)`                                                              | `LogoutButton.tsx`                     | `LogoutButton.test.tsx` — "clicking logout calls signOut(auth)"                  |
| AC2 | Durante `signOut`, botão mostra "Saindo…" e fica desabilitado                                      | `LogoutButton.tsx`                     | `LogoutButton.test.tsx` — "button shows Saindo… and is disabled…"                |
| AC3 | Logout bem-sucedido navega para /login com replace                                                 | `LogoutButton.tsx`                     | `LogoutButton.test.tsx` — "successful logout navigates to /login with replace"   |
| AC4 | Após logout, `onAuthStateChanged` dispara null; `useAuthState` retorna null                        | Firebase SDK (implícito via `signOut`) | Coberto implicitamente pelo AC1 — `signOut` dispara `onAuthStateChanged(null)`   |
| AC5 | Falha no `signOut`: mostra erro abaixo do botão; botão reabilitado com "Sair"; erro limpo no retry | `logoutErrors.ts` + `LogoutButton.tsx` | `LogoutButton.test.tsx` — "signOut failure shows…" / "error message is cleared…" |
| AC5 | `auth/network-request-failed` → "Erro de conexão. Tente novamente."                                | `logoutErrors.ts`                      | `logoutErrors.test.ts` — "auth/network-request-failed returns…"                  |
| AC6 | Browser back de /login após logout não retorna à página de origem                                  | `LogoutButton.tsx` (`replace: true`)   | Coberto pelo AC3 test — navigate chamado com `{ replace: true }`                 |
