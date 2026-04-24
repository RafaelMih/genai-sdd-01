# Feature Spec: Pokemon List

Version: 1.1.0
Status: Approved

## Objective

Exibir uma lista de Pokemons no dashboard do usuario autenticado, consumindo a PokeAPI publica, com um filtro por nome aplicado apos 2 segundos desde a ultima edicao no input.

## Scope

- Grade de cards de Pokemons na pagina do dashboard
- Estado de carregamento durante a requisicao
- Estado de erro com mensagem em pt-BR
- Consumo direto da PokeAPI publica sem autenticacao
- Input para filtro por nome
- Aplicacao do filtro local com debounce de 2 segundos

## Out of scope

- Paginacao ou "carregar mais"
- Filtro por tipo
- Detalhe individual de Pokemon
- Cache local ou persistencia no Firestore
- Integracao com Firebase
- Nova requisicao a API para cada alteracao do input

## User flow

1. Usuario autenticado acessa `/dashboard`
2. O componente `PokemonList` monta e inicia requisicao a PokeAPI com `limit=20` e `offset=0`
3. Durante a requisicao, o componente exibe "Carregando Pokemons..."
4. Quando a requisicao retorna com sucesso, o componente exibe um input de filtro por nome e a grade inicial com 20 cards
5. Usuario edita o input de filtro
6. Enquanto ainda nao se passaram 2 segundos desde a ultima edicao, a grade permanece no estado anterior
7. Quando se passam 2 segundos desde a ultima edicao:
   - se o input estiver vazio, a lista completa volta a ser exibida
   - se o input tiver valor, a lista exibe apenas os Pokemons cujo nome contenha o valor digitado em qualquer posicao
8. Cada card exibido continua mostrando numero formatado, nome capitalizado e sprite frontal
9. Se a requisicao falhar, o componente exibe "Erro ao carregar Pokemons. Tente novamente."

## Acceptance criteria

- AC1: Quando o componente `PokemonList` monta no dashboard e a requisicao a PokeAPI conclui com sucesso, o componente exibe uma grade com cards de Pokemons
- AC2: Quando a lista de Pokemons e renderizada com sucesso, cada card exibe o numero formatado como `#001`, o nome capitalizado com a primeira letra maiuscula e a imagem do sprite frontal
- AC3: Quando o componente `PokemonList` monta, ele chama a listagem da PokeAPI com `limit=20` e `offset=0` e carrega exatamente 20 Pokemons na resposta de sucesso
- AC4: Enquanto a requisicao inicial a PokeAPI esta em andamento, o componente exibe o texto "Carregando Pokemons..." e nao renderiza nenhum card
- AC5: Quando a requisicao a PokeAPI falha, o componente exibe "Erro ao carregar Pokemons. Tente novamente." e nao renderiza nenhum card
- AC6: Quando a requisicao inicial conclui com sucesso, o componente exibe um input para filtro por nome acima da grade de Pokemons
- AC7: Quando o usuario edita o input de filtro e ainda nao se passaram 2 segundos desde a ultima edicao, o componente continua exibindo a lista visivel anterior; quando os 2 segundos se completam, o componente exibe a lista filtrada correspondente ao valor atual do input
- AC8: Quando o filtro e aplicado com um valor nao vazio, o componente exibe apenas os Pokemons cujo nome contenha o valor digitado em qualquer posicao
- AC9: Quando o filtro e aplicado com o input vazio, o componente volta a exibir a lista completa retornada pela PokeAPI

## API contract

Endpoint:

```txt
GET https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
```

O filtro nao dispara novas requisicoes. Ele opera somente sobre a lista carregada com sucesso.

## UI state contract

| Estado | Renderizacao |
| --- | --- |
| loading | Texto "Carregando Pokemons..." |
| error | Texto "Erro ao carregar Pokemons. Tente novamente." |
| success sem filtro | Input de filtro + grade completa |
| success com filtro | Input de filtro + grade filtrada |

## Filter contract

- Campo: texto livre para filtro por nome
- Debounce: 2 segundos apos a ultima edicao do input
- Correspondencia: substring em qualquer posicao do nome do Pokemon
- Escopo do filtro: somente a lista carregada da requisicao atual
- Input vazio: restaura a lista completa

## Dependencies

- PokeAPI publica: `https://pokeapi.co/api/v2/`
- Sem dependencias de Firebase, ADR ou outros specs

## Tests

| Caso de teste | Tipo | ACs cobertos |
| --- | --- | --- |
| `parseIdFromUrl` extrai ID corretamente da URL | Unit | AC2, AC3 |
| `buildSpriteUrl` constroi URL correta para ID | Unit | AC2 |
| `formatPokemonNumber` formata com padding correto | Unit | AC2 |
| `capitalizeName` capitaliza nome corretamente | Unit | AC2 |
| `filterPokemonsByName` retorna apenas nomes que contem o valor digitado | Unit | AC8, AC9 |
| `fetchPokemons` retorna lista com id, name e spriteUrl | Unit | AC3 |
| `fetchPokemons` lanca erro em falha de rede | Unit | AC5 |
| Dashboard exibe "Carregando Pokemons..." durante fetch | Integration | AC4 |
| Dashboard exibe grade de cards apos fetch bem-sucedido | Integration | AC1, AC2, AC3 |
| Dashboard exibe mensagem de erro apos falha do fetch | Integration | AC5 |
| Dashboard exibe input de filtro apos sucesso | Integration | AC6 |
| Dashboard aplica o filtro apenas apos 2 segundos de inatividade | Integration | AC7, AC8 |
| Dashboard restaura a lista completa quando o input fica vazio | Integration | AC9 |

## Open questions

Nenhuma.
