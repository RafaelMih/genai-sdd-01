# Feature Spec: Auth

Version: 1.1.0
Status: Approved

## Objective

Allow users to sign in with an existing account using email and password.

## Scope

- Login page
- Form validation (client-side, before any Firebase call)
- Firebase Auth sign-in
- Redirect after success
- Friendly auth error messages (mapped per Firebase error code)
- Loading state during submission
- Redirect already-authenticated users away from the login page

## Out of scope

- Google sign-in
- Password reset
- MFA
- User registration (accounts are provisioned externally or via a separate feature)
- Route guard for /dashboard (assumed pre-existing; not implemented here)

## User flow

1. User opens the login page
2. If the user is already authenticated, redirect immediately to /dashboard
3. User enters email and password
4. On form submit, client-side validation runs first
5. If validation fails, field-level errors are shown and Firebase is NOT called
6. If validation passes, the submit button is disabled and a loading indicator is shown
7. System calls Firebase Auth `signInWithEmailAndPassword`
8. On success, redirect to /dashboard
9. On failure, show the mapped error message from the Error Messages contract

## Acceptance criteria

- AC1: Empty email shows validation error "E-mail é obrigatório"
- AC2: Malformed email (missing @, no domain) shows validation error "E-mail inválido"
- AC3: Empty password shows validation error "Senha é obrigatória"
- AC4: Password shorter than 6 characters shows "A senha deve ter pelo menos 6 caracteres"
- AC5: Wrong credentials show "E-mail ou senha incorretos."
- AC6: Disabled account shows "Esta conta foi desativada. Entre em contato com o suporte."
- AC7: Too many failed attempts show "Muitas tentativas. Tente novamente mais tarde."
- AC8: Network error shows "Falha na conexão. Verifique sua internet e tente novamente."
- AC9: All other Firebase errors show "Ocorreu um erro inesperado. Tente novamente."
- AC10: Successful login redirects to /dashboard
- AC11: Submit button is disabled and a loading indicator is visible while the Firebase request is in progress
- AC12: An already-authenticated user who navigates to /login is redirected to /dashboard

## Error messages contract

| Firebase error code          | Mensagem exibida ao usuário (pt-BR)                              |
|------------------------------|------------------------------------------------------------------|
| auth/user-not-found          | E-mail ou senha incorretos.                                      |
| auth/wrong-password          | E-mail ou senha incorretos.                                      |
| auth/invalid-credential      | E-mail ou senha incorretos.                                      |
| auth/invalid-email           | E-mail inválido                                                  |
| auth/user-disabled           | Esta conta foi desativada. Entre em contato com o suporte.       |
| auth/too-many-requests       | Muitas tentativas. Tente novamente mais tarde.                   |
| auth/network-request-failed  | Falha na conexão. Verifique sua internet e tente novamente.      |
| (todos os demais)            | Ocorreu um erro inesperado. Tente novamente.                     |

> `auth/user-not-found` e `auth/wrong-password` mapeiam para a mesma mensagem intencionalmente,
> para evitar enumeração de contas.

## Validation contract

**Email**
- Obrigatório (não vazio)
- Deve corresponder ao padrão `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` via Zod

**Password**
- Obrigatório (não vazio)
- Mínimo 6 caracteres (alinhado com o mínimo do Firebase Auth)

Validação roda client-side no submit e no blur. O Firebase não é chamado se a validação falhar.

## Redirect contract

- Caminho após login bem-sucedido: `/dashboard`
- Usuário já autenticado que acessa `/login` é redirecionado para `/dashboard` imediatamente

## Account provisioning

Cadastro de novos usuários está fora do escopo desta feature. As contas devem ser criadas via
Firebase console, Admin SDK, ou uma feature separada de sign-up. Este spec não define o fluxo
de cadastro.

## Firestore behavior

Esta feature não cria nem modifica nenhum documento Firestore. A autenticação é tratada
integralmente pelo Firebase Auth client SDK. Documentos de perfil (`users/{uid}`) são
responsabilidade de uma feature separada de onboarding ou cadastro.

## Dependencies

- specs/decisions/ADR-001-use-firebase.md

## Tests

| Caso de teste                              | Tipo        | ACs cobertos |
|--------------------------------------------|-------------|--------------|
| Validação de email vazio                   | Unit        | AC1          |
| Validação de email malformado              | Unit        | AC2          |
| Validação de senha vazia                   | Unit        | AC3          |
| Validação de senha curta                   | Unit        | AC4          |
| Erro de credenciais inválidas              | Integration | AC5          |
| Erro de conta desativada                   | Integration | AC6          |
| Erro de muitas tentativas                  | Integration | AC7          |
| Erro de rede                               | Integration | AC8          |
| Erro genérico do Firebase                  | Integration | AC9          |
| Login bem-sucedido redireciona             | Integration | AC10         |
| Estado de carregamento durante submit      | Integration | AC11         |
| Redirecionamento de usuário já autenticado | Integration | AC12         |

## Open questions

Nenhuma.
