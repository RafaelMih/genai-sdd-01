# Changelog - User Signup

## v1.2.1

- Status promovido de Draft para Approved
- Validation contract (Phone): descrição do regex corrigida para refletir o comportamento real do `{8,20}` quantificador (aplicado à porção após o `+` opcional); adicionados exemplos concretos válidos e inválidos

## v1.2.0

- Adicionado campo de telefone opcional ao escopo
- Out of scope: adicionado "Server-side phone number verification"
- Acceptance criteria: adicionados AC19, AC20, AC21
- Validation contract: adicionada seção Phone com regex `/^\+?[\d\s()\-]{8,20}$/` e mensagem "Telefone inválido"
- Firestore write contract: adicionada coluna Condition; campo `phone` escrito somente se não vazio
- UI state contract: mensagem de erro reposicionada para "between the phone field and the submit button"
- User flow: mensagem de erro de Firebase reposicionada para entre o campo telefone e o botão
- Tests: adicionados 4 casos (telefone vazio, telefone inválido, Firestore com phone, Firestore sem phone)

## v1.1.0

- Status promovido de Draft para Approved
- Adicionada seção de Acceptance Criteria (AC1–AC18) com critérios binários, observáveis e testáveis
- Validation contract: adicionadas mensagens de erro por regra para todos os campos
- Validation contract: adicionado campo confirm password com regras e mensagens
- Validation contract: adicionadas trigger rules (mode: onSubmit, reValidateMode: onChange)
- Error messages contract: adicionado `auth/invalid-email` como fallback de bypass client-side
- Redirect contract: adicionada linha para redirect de usuário já autenticado (`replace`)
- Auth state contract: "show loading" substituído por "Nothing (no flash of form)" para estado `undefined`
- UI state contract: `"Criando conta..."` corrigido para `"Criando conta…"` (U+2026)
- UI state contract: adicionadas colunas de Firebase error message e lifecycle explicitado
- Firestore write contract: campo `uid` removido (redundante com document ID; inconsistente com schema técnico)
- Firestore write contract: campo `displayName` passa a ser "trimmed" → "as entered" (sem normalização implícita)
- Partial failure contract: adicionada seção explicitando comportamento quando auth sucede e Firestore falha
- Adicionada seção Session contract
- Adicionada seção Account provisioning
- Dependencies: declaradas explicitamente (ADR-001, firestore-schema, security-rules, Firebase SDK, /dashboard)
- User flow: expandido para incluir `onAuthStateChanged` explícito e ambos os caminhos de falha

## v1.0.0

- Initial feature spec
