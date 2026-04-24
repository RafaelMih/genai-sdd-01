# Changelog - Auth

## v1.1.3

- User flow step 2: adicionada nota explícita de que o observer `onAuthStateChanged` trata apenas o caso de page-mount (AC12), não o redirect pós-login
- User flow step 8: reescrito para deixar explícito que o redirect pós-login é uma chamada direta de `navigate` no submit handler de `LoginForm`, independente do `onAuthStateChanged`
- AC10: reescrito para especificar que a chamada de `navigate` é direta no submit handler, não via `onAuthStateChanged`
- Redirect contract: adicionada coluna "Mechanism" especificando o mecanismo exato de cada redirect (AC10 = direct `navigate` em `LoginForm`; AC12 = observer em `LoginPage`)
- Redirect contract: adicionado parágrafo explicitando que os dois mecanismos são independentes
- Auth state contract: adicionada nota explicando que o estado `User` do observer só é atingido em page-mount; o submit handler redireciona antes do observer disparar pós-login
- Tabela de testes: AC10 renomeado para refletir "submit handler chama navigate diretamente"

## v1.1.2

- Redirect contract: redirect pós-login bem-sucedido agora especifica `replace: true`
- Redirect contract: reescrito como tabela com colunas `trigger`, `source`, `destination`, `semantics`, `browser back behavior`
- Redirect contract: comportamento do botão "voltar" após ambos os redirects definido explicitamente
- AC1–AC4: placement das mensagens de validação explicitado ("below the [field] field")
- AC5–AC9: placement da mensagem Firebase explicitado ("between the password field and the submit button")
- AC10: `replace` semantics agora mencionado diretamente no texto do AC
- AC12: `replace: true` e comportamento do "voltar" agora explicitados no texto do AC
- UI state contract: adicionada tabela com 4 estados (default, submitting, error, success)
- UI state contract: lifecycle da mensagem de erro Firebase explicitado (apagada no próximo submit, não em input change)
- UI state contract: label padrão do botão ("Entrar") explicitado
- Error messages contract: adicionada nota sobre `.code` como propriedade string do `AuthError`
- Dependencies: Firebase SDK functions listadas explicitamente; rota /dashboard listada como dependência de deploy

## v1.1.1

- AC2: reescrito para referenciar o Validation contract em vez de listar exemplos incompletos
- AC11: expandido para cobrir a saída do estado de carregamento (botão reabilitado em erro, redirect em sucesso)
- AC12: mecanismo de detecção especificado explicitamente (`onAuthStateChanged`)
- Error messages contract: adicionada nota sobre `auth/invalid-email` como fallback de client-side bypass
- Validation contract: adicionadas regras de trigger (submit + blur pós-primeiro-submit); blur declarado sem AC próprio
- Auth state contract: adicionada seção explicitando os três estados possíveis (`undefined`/`null`/`User`)
- Session contract: adicionada seção declarando persistência `local` do Firebase como padrão
- User flow passo 2: `replace: true` tornado explícito; comportamento de "render nothing" formalizado
- User flow passo 8: comportamento do formulário após sucesso tornado explícito (não resetado; página é desmontada)
- User flow passo 9: comportamento de saída do loading após falha tornado explícito
- Out of scope: route guard expandido para "must exist before this feature is deployed"; session persistence adicionada

## v1.1.0

- Resolved dashboard redirect path: /dashboard
- Added error messages contract with Firebase error code → pt-BR string mapping
- Added validation contract (email regex + password min 6 chars via Zod)
- Clarified validation timing: client-side first, Firebase not called on failure
- Added AC11: loading state during submission
- Added AC12: already-authenticated user redirect
- Removed misleading dependency on security-rules spec (no Firestore writes in this feature)
- Added Firestore behavior section clarifying no document is written at login
- Added account provisioning note (sign-up is out of scope)
- Removed open question about dashboard path (resolved)

## v1.0.0

- Initial auth spec with email/password login
