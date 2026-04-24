# Feature Spec: Pokemon List

Version: 1.0.0
Status: Approved

## Objective

Exibir uma lista de Pokémons no dashboard do usuário autenticado, consumindo a PokéAPI pública.

## Scope

- Grade de cards de Pokémons na página do dashboard
- Estado de carregamento durante a requisição
- Estado de erro com mensagem em pt-BR
- Consumo direto da PokéAPI pública sem autenticação

## Out of scope

- Paginação ou "carregar mais"
- Busca ou filtro por nome/tipo
- Detalhe individual de Pokémon
- Cache local ou persistência no Firestore
- Integração com Firebase (PokéAPI é pública e não requer servidor)

## User flow

1. Usuário autenticado acessa `/dashboard`
2. O componente `PokemonList` monta e inicia requisição à PokéAPI (limit=20, offset=0)
3. Durante a requisição, exibe "Carregando Pokémons..."
4. Quando a requisição retorna com sucesso, exibe a grade com 20 cards
5. Cada card exibe: número formatado (`#001`), nome capitalizado e sprite frontal
6. Se a requisição falhar (rede, timeout, erro HTTP), exibe "Erro ao carregar Pokémons. Tente novamente."

## Acceptance criteria

- AC1: Ao montar o dashboard, o componente `PokemonList` renderiza uma grade com cards de Pokémons
- AC2: Cada card exibe o número do Pokémon formatado como `#001`, o nome capitalizado (primeira letra maiúscula) e a imagem do sprite frontal
- AC3: A lista carrega exatamente 20 Pokémons (limit=20, offset=0) na montagem
- AC4: Durante o carregamento, o componente exibe o texto "Carregando Pokémons..." e nenhum card é renderizado
- AC5: Se a requisição à PokéAPI falhar, o componente exibe "Erro ao carregar Pokémons. Tente novamente." e nenhum card é renderizado

## API contract

**Endpoint de listagem:**

```
GET https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
```

Resposta:

```json
{
  "count": 1302,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" },
    { "name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/" }
  ]
}
```

**Extração do ID e sprite:**

O ID é extraído da `url` de cada resultado via regex: o último segmento numérico antes da barra final.

```
"https://pokeapi.co/api/v2/pokemon/1/" → id = 1
```

O sprite frontal é construído sem chamada adicional:

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
```

Esta abordagem evita 20 requisições extras de detalhe por Pokémon.

## UI state contract

| Estado  | Renderização                                        |
| ------- | --------------------------------------------------- |
| loading | Texto "Carregando Pokémons..." (nenhum card)        |
| error   | Texto "Erro ao carregar Pokémons. Tente novamente." |
| success | Grade de `PokemonCard` (um por Pokémon retornado)   |

## Data contract

| Campo exibido | Origem                      | Transformação                            |
| ------------- | --------------------------- | ---------------------------------------- |
| Número        | `id` extraído da `url`      | `#${String(id).padStart(3, '0')}`        |
| Nome          | `name` do resultado         | Primeira letra maiúscula                 |
| Sprite        | Construído a partir do `id` | URL do repositório de sprites do PokeAPI |

## Dependencies

- PokéAPI pública: `https://pokeapi.co/api/v2/`
- Sem dependências de Firebase, ADR ou outros specs

## Tests

| Caso de teste                                          | Tipo        | ACs cobertos  |
| ------------------------------------------------------ | ----------- | ------------- |
| `parseIdFromUrl` extrai ID corretamente da URL         | Unit        | AC2, AC3      |
| `buildSpriteUrl` constrói URL correta para ID          | Unit        | AC2           |
| `formatPokemonNumber` formata com padding correto      | Unit        | AC2           |
| `capitalizeName` capitaliza nome corretamente          | Unit        | AC2           |
| `fetchPokemons` retorna lista com id, name, spriteUrl  | Unit        | AC3           |
| `fetchPokemons` lança erro em falha de rede            | Unit        | AC5           |
| Dashboard exibe "Carregando Pokémons..." durante fetch | Integration | AC4           |
| Dashboard exibe grade de cards após fetch bem-sucedido | Integration | AC1, AC2, AC3 |
| Dashboard exibe mensagem de erro após falha do fetch   | Integration | AC5           |

## Open questions

Nenhuma.
