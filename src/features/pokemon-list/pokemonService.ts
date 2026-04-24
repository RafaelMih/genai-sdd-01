const POKEAPI_LIST_URL =
  "https://pokeapi.co/api/v2/pokemon?limit=20&offset=0";

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

export function parseIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/$/);
  if (!match) throw new Error(`URL inválida: ${url}`);
  return parseInt(match[1], 10);
}

export function buildSpriteUrl(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}

export function formatPokemonNumber(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

export function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function fetchPokemons(): Promise<Pokemon[]> {
  const res = await fetch(POKEAPI_LIST_URL);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const data = (await res.json()) as {
    results: Array<{ name: string; url: string }>;
  };
  return data.results.map(({ name, url }) => {
    const id = parseIdFromUrl(url);
    return { id, name, spriteUrl: buildSpriteUrl(id) };
  });
}
