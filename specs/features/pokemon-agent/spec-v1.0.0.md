# Feature Spec: Pokemon Agent

Version: 1.0.0
Status: Approved

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

## Fluxos

### Listagem padrão

1. Agente é ativado (trigger automático ou manual)
2. Chama `list_pokemons(limit=20, offset=0)`
3. Exibe tabela com: número `#001`, nome capitalizado e URL do sprite

### Paginação

1. Usuário pede "traga mais" ou "próxima página"
2. Agente chama `list_pokemons(limit=20, offset=N)` onde N é o offset atual + 20
3. Exibe os próximos 20

### Filtro por nome

1. Usuário pede filtro (ex: "pokémons com 'char'")
2. Agente chama `list_pokemons(limit=100, offset=0)` para ter volume suficiente
3. Filtra localmente pelo prefixo informado (case-insensitive)
4. Exibe apenas os correspondentes

### Detalhe

1. Usuário pede detalhes de um Pokémon (ex: "detalhes do pikachu" ou "detalhes do #25")
2. Agente chama `get_pokemon(name_or_id)`
3. Exibe: id, nome, tipos, stats (HP, Ataque, Defesa, Velocidade) e URL do sprite

## Acceptance criteria

- AC1: Quando ativado sem filtro, o agente chama `list_pokemons(limit=20, offset=0)` e exibe os resultados formatados em pt-BR
- AC2: Quando o usuário pede "mais" ou "próxima página", o agente chama `list_pokemons` com offset incrementado em 20 e exibe os próximos resultados
- AC3: Quando o usuário pede filtro por prefixo de nome, o agente chama `list_pokemons(limit=100, offset=0)`, filtra localmente pelo prefixo informado (case-insensitive) e exibe apenas os correspondentes
- AC4: Quando o usuário pede detalhes de um Pokémon específico por nome ou número, o agente chama `get_pokemon(name_or_id)` e exibe id, nome, tipos, stats e URL do sprite
- AC5: Todas as respostas do agente são em pt-BR; nomes de Pokémon e termos técnicos (HP, JSON) não são traduzidos

## Contracts

### Ferramentas MCP disponíveis

| Ferramenta      | Parâmetros                        | Retorno                                  |
| --------------- | --------------------------------- | ---------------------------------------- |
| `list_pokemons` | `limit: number`, `offset: number` | `Array<{ name, url }>`                   |
| `get_pokemon`   | `name_or_id: string`              | `{ id, name, sprite, types[], stats[] }` |

### Formato de exibição — listagem

```
| #   | Nome        | Sprite |
|-----|-------------|--------|
| #001 | Bulbasaur  | URL    |
```

### Formato de exibição — detalhe

```
#025 — Pikachu
Tipos: electric
HP: 35 | Ataque: 55 | Defesa: 40 | Velocidade: 90
Sprite: https://...
```

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

## Open questions

Nenhuma.
