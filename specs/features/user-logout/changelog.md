# Changelog - User Logout

## v1.1.0

- Status promovido de Draft para Approved
- "Saindo..." corrigido para "Saindo…" (U+2026) em UI state contract e AC2
- AC4 removido — "accessing protected routes redirects to /login" é comportamento de route guard (dependência), não do logout; route guard declarado como dependência explícita
- ACs renumerados: AC5→AC4, AC6→AC5, AC7→AC6
- Error messages contract: adicionado mapeamento de código Firebase (`auth/network-request-failed` → mensagem de conexão; demais → mensagem genérica)
- UI state contract: adicionada coluna Error message com lifecycle explícito ("cleared when a new logout attempt begins")
- Erro renderizado abaixo do botão (posicionamento explícito)
- Auth state contract: esclarecido que `LogoutButton` não renderiza para estados null/undefined (componente dentro de layout auth-gated)
- Session cleanup contract: simplificado para comportamento observável; linguagem vaga ("if used", "Cancel active listeners") removida
- AC7 (agora AC6): restrito de "authenticated pages" para "the page from which logout was triggered" — o claim mais amplo é responsabilidade dos route guards
- Tabela de testes: convertida para formato tabular com mapeamento de ACs, consistente com outros specs
- Out of scope: adicionados "Route guard implementation" e "Placement of LogoutButton in app layout"

## v1.0.0

- Initial feature spec
