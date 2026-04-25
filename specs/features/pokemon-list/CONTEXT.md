# Context - pokemon-list

Spec: specs/features/pokemon-list/spec-v1.1.0.md

Contexto canonico curto para trabalho assistido por IA.
Use este arquivo antes de qualquer retrieval expandido.

## Objective

Exibir uma lista de Pokemons no dashboard do usuario autenticado, consumindo a PokeAPI publica, com um filtro por nome aplicado apos 2 segundos desde a ultima edicao no input.

## Scope

- Grade de cards de Pokemons na pagina do dashboard
- Estado de carregamento durante a requisicao
- Estado de erro com mensagem em pt-BR
- Consumo direto da PokeAPI publica sem autenticacao
- Input para filtro por nome
- Aplicacao do filtro local com debounce de 2 segundos

## Active Acceptance Criteria

- AC1: Quando o componente `PokemonList` monta no dashboard e a requisicao a PokeAPI conclui com sucesso, o componente exibe uma grade com cards de Pokemons
- AC2: Quando a lista de Pokemons e renderizada com sucesso, cada card exibe o numero formatado como `#001`, o nome capitalizado com a primeira letra maiuscula...
- AC3: Quando o componente `PokemonList` monta, ele chama a listagem da PokeAPI com `limit=20` e `offset=0` e carrega exatamente 20 Pokemons na resposta de suc...
- AC4: Enquanto a requisicao inicial a PokeAPI esta em andamento, o componente exibe o texto "Carregando Pokemons..." e nao renderiza nenhum card
- AC5: Quando a requisicao a PokeAPI falha, o componente exibe "Erro ao carregar Pokemons. Tente novamente." e nao renderiza nenhum card
- AC6: Quando a requisicao inicial conclui com sucesso, o componente exibe um input para filtro por nome acima da grade de Pokemons
- AC7: Quando o usuario edita o input de filtro e ainda nao se passaram 2 segundos desde a ultima edicao, o componente continua exibindo a lista visivel anteri...
- AC8: Quando o filtro e aplicado com um valor nao vazio, o componente exibe apenas os Pokemons cujo nome contenha o valor digitado em qualquer posicao
- AC9: Quando o filtro e aplicado com o input vazio, o componente volta a exibir a lista completa retornada pela PokeAPI

## Contracts

- API contract: Endpoint:
- UI state contract: See active spec.
- Filter contract: - Campo: texto livre para filtro por nome

## Target Files

- PokemonList.tsx
- PokemonCard.tsx, pokemonService.ts
- pokemonService.ts, usePokemonList.ts
- PokemonList.tsx, usePokemonList.ts
- PokemonList.tsx, pokemonService.ts
