# Traceability Summary - Pokemon List

Spec: specs/features/pokemon-list/spec-v1.0.0.md

## Acceptance Criteria Mapping

| AC   | Critério                                             | Módulo(s)                                |
| ---- | ---------------------------------------------------- | ---------------------------------------- |
| AC1  | Dashboard exibe grade de cards de Pokémons           | `PokemonList.tsx`                        |
| AC2  | Card exibe número `#001`, nome capitalizado e sprite | `PokemonCard.tsx`, `pokemonService.ts`   |
| AC3  | Carrega 20 Pokémons com limit=20 offset=0            | `pokemonService.ts`, `usePokemonList.ts` |
| AC4  | Exibe "Carregando Pokémons..." durante fetch         | `PokemonList.tsx`, `usePokemonList.ts`   |
| AC5  | Exibe mensagem de erro em falha                      | `PokemonList.tsx`, `usePokemonList.ts`   |
