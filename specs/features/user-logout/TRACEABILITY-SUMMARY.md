# Traceability Summary - User Logout

Spec: specs/features/user-logout/spec-v1.1.0.md

## Acceptance Criteria Mapping

| AC   | Critério                                                                                           | Módulo(s)                              |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC1  | Clicar no botão chama `signOut(auth)`                                                              | `LogoutButton.tsx`                     |
| AC2  | Durante `signOut`, botão mostra "Saindo…" e fica desabilitado                                      | `LogoutButton.tsx`                     |
| AC3  | Logout bem-sucedido navega para /login com replace                                                 | `LogoutButton.tsx`                     |
| AC4  | Após logout, `onAuthStateChanged` dispara null; `useAuthState` retorna null                        | Firebase SDK (implícito via `signOut`) |
| AC5  | Falha no `signOut`: mostra erro abaixo do botão; botão reabilitado com "Sair"; erro limpo no retry | `logoutErrors.ts` + `LogoutButton.tsx` |
| AC5  | `auth/network-request-failed` → "Erro de conexão. Tente novamente."                                | `logoutErrors.ts`                      |
| AC6  | Browser back de /login após logout não retorna à página de origem                                  | `LogoutButton.tsx` (`replace: true`)   |
