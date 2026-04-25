# Context - pokemon-agent

Spec: specs/features/pokemon-agent/spec-v1.0.0.md

Contexto canonico curto para trabalho assistido por IA.
Use este arquivo antes de qualquer retrieval expandido.

## Objective

Definir o comportamento de um agente especializado em Pokémons que usa as ferramentas do MCP (`list_pokemons`, `get_pokemon`) para responder perguntas do usuário sobre listagem, paginação, filtro e detalhes de Pokémons.

## Scope

- Listagem dos primeiros 20 Pokémons ao ser ativado
- Paginação: carregar os próximos 20 ao pedido do usuário
- Filtro por prefixo de nome dentro de um lote de 100 resultados
- Detalhe de um Pokémon específico por nome ou número
- Respostas sempre em pt-BR
- Uso exclusivo das ferramentas MCP; sem chamadas diretas à PokéAPI

## Active Acceptance Criteria

- AC1: Quando o agente é ativado sem filtro explícito de nome ou detalhe, ele chama `list_pokemons(limit=20, offset=0)` e exibe os resultados formatados em pt-BR
- AC2: Quando o usuário pede "mais" ou "próxima página" após uma listagem anterior, o agente chama `list_pokemons` com offset incrementado em 20 e exibe os pró...
- AC3: Quando o usuário pede filtro por prefixo de nome, o agente chama `list_pokemons(limit=100, offset=0)`, filtra localmente pelo prefixo informado com comp...
- AC4: Quando o usuário pede detalhes de um Pokémon específico por nome ou número, o agente chama `get_pokemon(name_or_id)` e exibe id, nome, tipos, stats e UR...
- AC5: Quando o agente responde a qualquer fluxo definido nesta spec, a resposta final exibe texto em pt-BR e preserva sem tradução os nomes de Pokémon e termo...

## Contracts

- Contracts: ### Ferramentas MCP disponíveis

## Target Files

- mcp/pokemon-service.ts — listPokemons; .claude/agents/pokemon-agent.md — Fluxo 1
- mcp/pokemon-service.ts — listPokemons; .claude/agents/pokemon-agent.md — Fluxo 2
- mcp/pokemon-service.ts — listPokemons; .claude/agents/pokemon-agent.md — Fluxo 3
- mcp/pokemon-service.ts — getPokemon; .claude/agents/pokemon-agent.md — Fluxo 4
- .claude/agents/pokemon-agent.md — Regras
