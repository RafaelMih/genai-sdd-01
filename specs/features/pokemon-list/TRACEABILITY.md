# Traceability - Pokemin List

Spec: specs/features/pokemon-list/spec-v1.0.0.md

## Acceptance Criteria Mapping

| AC  | Critério                                             | Módulo(s)                                | Caso(s) de teste                                                                                                                                |
| --- | ---------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Dashboard exibe grade de cards de Pokémons           | `PokemonList.tsx`                        | `PokemonList.test.tsx` — "exibe grade de cards após fetch bem-sucedido"                                                                         |
| AC2 | Card exibe número `#001`, nome capitalizado e sprite | `PokemonCard.tsx`, `pokemonService.ts`   | `pokemonService.test.ts` — "formatPokemonNumber", "capitalizeName", "buildSpriteUrl"; `PokemonList.test.tsx` — "exibe dados corretos nos cards" |
| AC3 | Carrega 20 Pokémons com limit=20 offset=0            | `pokemonService.ts`, `usePokemonList.ts` | `pokemonService.test.ts` — "fetchPokemons retorna lista com id, name, spriteUrl"                                                                |
| AC4 | Exibe "Carregando Pokémons..." durante fetch         | `PokemonList.tsx`, `usePokemonList.ts`   | `PokemonList.test.tsx` — "exibe loading durante fetch"                                                                                          |
| AC5 | Exibe mensagem de erro em falha                      | `PokemonList.tsx`, `usePokemonList.ts`   | `PokemonList.test.tsx` — "exibe mensagem de erro após falha do fetch"                                                                           |
