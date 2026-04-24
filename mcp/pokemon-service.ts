const POKEAPI_BASE = "https://pokeapi.co/api/v2";

type PokemonListResult = {
  name: string;
  url: string;
};

type PokemonListResponse = {
  count: number;
  results: PokemonListResult[];
};

type PokemonDetail = {
  id: number;
  name: string;
  sprites: { front_default: string | null };
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
};

export type PokemonListItem = {
  name: string;
  url: string;
};

export type PokemonDetailResult = {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats: Array<{ name: string; base: number }>;
};

export async function listPokemons(limit: number, offset: number): Promise<PokemonListItem[]> {
  const url = `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`PokéAPI retornou ${res.status}`);
  }

  const data = (await res.json()) as PokemonListResponse;
  return data.results.map((p) => ({ name: p.name, url: p.url }));
}

export async function getPokemon(nameOrId: string): Promise<PokemonDetailResult> {
  const url = `${POKEAPI_BASE}/pokemon/${nameOrId}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`PokéAPI retornou ${res.status} para "${nameOrId}"`);
  }

  const data = (await res.json()) as PokemonDetail;

  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites.front_default,
    types: data.types.map((t) => t.type.name),
    stats: data.stats.map((s) => ({ name: s.stat.name, base: s.base_stat })),
  };
}
