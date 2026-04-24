# Context - pokemon-list

Spec: specs/features/pokemon-list/spec-v1.0.0.md

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

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
2. O componente `PokemonList` monta e inicia requisição à PokéAPI (`limit=20`, `offset=0`)
3. Durante a requisição, exibe "Carregando Pokémons..."
4. Quando a requisição retorna com sucesso, exibe a grade com 20 cards
5. Cada card exibe: número formatado (`#001`), nome capitalizado e sprite frontal
6. Se a requisição falhar (rede, timeout, erro HTTP), exibe "Erro ao carregar Pokémons. Tente novamente."

## Acceptance criteria

- AC1: Quando o componente `PokemonList` monta no dashboard e a requisição à PokéAPI conclui com sucesso, o componente exibe uma grade com cards de Pokémons
- AC2: Quando a lista de Pokémons é renderizada com sucesso, cada card exibe o número formatado como `#001`, o nome capitalizado com a primeira letra maiúscula e a imagem do sprite frontal
- AC3: Quando o componente `PokemonList` monta, ele chama a listagem da PokéAPI com `limit=20` e `offset=0` e carrega exatamente 20 Pokémons na resposta de sucesso
- AC4: Enquanto a requisição inicial à PokéAPI está em andamento, o componente exibe o texto "Carregando Pokémons..." e não renderiza nenhum card
- AC5: Quando a requisição à PokéAPI falha, o componente exibe "Erro ao carregar Pokémons. Tente novamente." e não renderiza nenhum card

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
