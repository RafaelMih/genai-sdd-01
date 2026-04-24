# Traceability Summary - Pokemon List

Spec: specs/features/pokemon-list/spec-v1.1.0.md

## Acceptance Criteria Mapping

| AC   | Critério                                                | Módulo(s)                                |
| ---- | ------------------------------------------------------- | ---------------------------------------- |
| AC1  | Dashboard exibe grade de cards de Pokemons              | `PokemonList.tsx`                        |
| AC2  | Card exibe numero `#001`, nome capitalizado e sprite    | `PokemonCard.tsx`, `pokemonService.ts`   |
| AC3  | Carrega 20 Pokemons com limit=20 offset=0               | `pokemonService.ts`, `usePokemonList.ts` |
| AC4  | Exibe "Carregando Pokemons..." durante fetch            | `PokemonList.tsx`, `usePokemonList.ts`   |
| AC5  | Exibe mensagem de erro em falha                         | `PokemonList.tsx`, `usePokemonList.ts`   |
| AC6  | Exibe input de filtro apos sucesso                      | `PokemonList.tsx`                        |
| AC7  | Aplica debounce de 2 segundos antes de filtrar          | `PokemonList.tsx`                        |
| AC8  | Exibe apenas Pokemons cujo nome contem o valor digitado | `PokemonList.tsx`, `pokemonService.ts`   |
| AC9  | Restaura a lista completa quando o input fica vazio     | `PokemonList.tsx`, `pokemonService.ts`   |
