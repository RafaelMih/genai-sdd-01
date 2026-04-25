# Traceability - Pokemon Agent

Spec: specs/features/pokemon-agent/spec-v1.0.0.md

## Acceptance Criteria Mapping

| AC  | Critério                                              | Módulo(s)                                                                              | Teste                                                                                                    |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| AC1 | Listagem padrão via `list_pokemons(20, 0)`            | `mcp/pokemon-service.ts` — `listPokemons`; `.claude/agents/pokemon-agent.md` — Fluxo 1 | `pokemon-agent.contract.test.ts` — "AC1: chama a URL correta com limit=20 e offset=0 na listagem padrao" |
| AC2 | Paginação com offset incrementado                     | `mcp/pokemon-service.ts` — `listPokemons`; `.claude/agents/pokemon-agent.md` — Fluxo 2 | `pokemon-agent.contract.test.ts` — "AC2: chama com offset=20 na segunda pagina"                          |
| AC3 | Filtro local por prefixo após `list_pokemons(100, 0)` | `mcp/pokemon-service.ts` — `listPokemons`; `.claude/agents/pokemon-agent.md` — Fluxo 3 | `pokemon-agent.contract.test.ts` — "AC3: chama com limit=100 para filtro local"                          |
| AC4 | Detalhe via `get_pokemon(name_or_id)`                 | `mcp/pokemon-service.ts` — `getPokemon`; `.claude/agents/pokemon-agent.md` — Fluxo 4   | `pokemon-agent.contract.test.ts` — "AC4: retorna id, name, sprite, types e stats"                        |
| AC5 | Respostas em pt-BR                                    | `.claude/agents/pokemon-agent.md` — Regras                                             | Verificação manual: confirmar que toda resposta está em pt-BR                                            |
