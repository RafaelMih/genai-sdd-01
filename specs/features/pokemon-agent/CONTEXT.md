# Context - pokemon-agent

Spec: specs/features/pokemon-agent/spec-v1.0.0.md

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

## Objective

Definir o comportamento de um agente especializado em Pokémons que usa as ferramentas do MCP (`list_pokemons`, `get_pokemon`) para responder perguntas do usuário sobre listagem, paginação, filtro e detalhes de Pokémons.

## Scope

- Listagem dos primeiros 20 Pokémons ao ser ativado
- Paginação: carregar os próximos 20 ao pedido do usuário
- Filtro por prefixo de nome dentro de um lote de 100 resultados
- Detalhe de um Pokémon específico por nome ou número
- Respostas sempre em pt-BR
- Uso exclusivo das ferramentas MCP; sem chamadas diretas à PokéAPI

## Out of scope

- Filtro por tipo (requer N chamadas de detalhe)
- Cache de resultados anteriores entre sessões
- Comparação entre Pokémons
- Evolução ou árvore evolutiva

## Acceptance criteria

- AC1: Quando o agente é ativado sem filtro explícito de nome ou detalhe, ele chama `list_pokemons(limit=20, offset=0)` e exibe os resultados formatados em pt-BR
- AC2: Quando o usuário pede "mais" ou "próxima página" após uma listagem anterior, o agente chama `list_pokemons` com offset incrementado em 20 e exibe os próximos resultados
- AC3: Quando o usuário pede filtro por prefixo de nome, o agente chama `list_pokemons(limit=100, offset=0)`, filtra localmente pelo prefixo informado com comparação case-insensitive e exibe apenas os correspondentes
- AC4: Quando o usuário pede detalhes de um Pokémon específico por nome ou número, o agente chama `get_pokemon(name_or_id)` e exibe id, nome, tipos, stats e URL do sprite
- AC5: Quando o agente responde a qualquer fluxo definido nesta spec, a resposta final exibe texto em pt-BR e preserva sem tradução os nomes de Pokémon e termos técnicos como `HP` e `JSON`

## Dependencies

- MCP server `pokemon` registrado em `.claude/settings.json`
- `mcp/pokemon-mcp.ts` expondo `list_pokemons` e `get_pokemon`

## Tests

| Caso de teste                                                           | Tipo               | ACs cobertos |
| ----------------------------------------------------------------------- | ------------------ | ------------ |
| Agente chama `list_pokemons(20, 0)` ao ser ativado sem filtro           | Manual/Integration | AC1          |
| Resultado exibe tabela com número `#001` e nome capitalizado            | Manual/Integration | AC1          |
| Ao dizer "traga mais", agente chama `list_pokemons(20, 20)`             | Manual/Integration | AC2          |
| Ao filtrar por 'char', retorna Charmander, Charmeleon, Charizard        | Manual/Integration | AC3          |
| Ao filtrar por texto inexistente, exibe mensagem de "Nenhum encontrado" | Manual/Integration | AC3          |
| Ao pedir "detalhes do pikachu", agente chama `get_pokemon("pikachu")`   | Manual/Integration | AC4          |
| Resposta de detalhe exibe tipos e stats                                 | Manual/Integration | AC4          |
| Todas as respostas estão em pt-BR                                       | Manual             | AC5          |
