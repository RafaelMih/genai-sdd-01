# Traceability - Pokemon List

Spec: specs/features/pokemon-list/spec-v1.1.0.md

## Acceptance Criteria Mapping

| AC  | Critério                                                | Módulo(s)                                | Caso(s) de teste                                                                                                                                                                     |
| --- | ------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 | Dashboard exibe grade de cards de Pokemons              | `PokemonList.tsx`                        | `PokemonList.test.tsx` - "exibe grade de cards apos fetch bem-sucedido"                                                                                                              |
| AC2 | Card exibe numero `#001`, nome capitalizado e sprite    | `PokemonCard.tsx`, `pokemonService.ts`   | `pokemonService.test.ts` - "formatPokemonNumber", "capitalizeName", "buildSpriteUrl"; `PokemonList.test.tsx` - "exibe grade de cards apos fetch bem-sucedido"                        |
| AC3 | Carrega 20 Pokemons com limit=20 offset=0               | `pokemonService.ts`, `usePokemonList.ts` | `pokemonService.test.ts` - "fetchPokemons retorna lista com id, name e spriteUrl"                                                                                                    |
| AC4 | Exibe "Carregando Pokemons..." durante fetch            | `PokemonList.tsx`, `usePokemonList.ts`   | `PokemonList.test.tsx` - "exibe 'Carregando Pokemons...' durante o fetch"                                                                                                            |
| AC5 | Exibe mensagem de erro em falha                         | `PokemonList.tsx`, `usePokemonList.ts`   | `PokemonList.test.tsx` - "exibe mensagem de erro apos falha do fetch"                                                                                                                |
| AC6 | Exibe input de filtro apos sucesso                      | `PokemonList.tsx`                        | `PokemonList.test.tsx` - "exibe input de filtro apos sucesso"                                                                                                                        |
| AC7 | Aplica debounce de 2 segundos antes de filtrar          | `PokemonList.tsx`                        | `PokemonList.test.tsx` - "aplica o filtro apenas apos 2 segundos de inatividade"                                                                                                     |
| AC8 | Exibe apenas Pokemons cujo nome contem o valor digitado | `PokemonList.tsx`, `pokemonService.ts`   | `pokemonService.test.ts` - "filterPokemonsByName retorna apenas nomes que contem o valor digitado"; `PokemonList.test.tsx` - "aplica o filtro apenas apos 2 segundos de inatividade" |
| AC9 | Restaura a lista completa quando o input fica vazio     | `PokemonList.tsx`, `pokemonService.ts`   | `pokemonService.test.ts` - "filterPokemonsByName retorna a lista completa quando a consulta e vazia"; `PokemonList.test.tsx` - "restaura a lista completa quando o input fica vazio" |
