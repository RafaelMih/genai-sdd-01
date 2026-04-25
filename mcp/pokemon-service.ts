import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const CACHE_ROOT = path.resolve(".telemetry", "cache", "pokemon");
const LIST_TTL_MS = 10 * 60 * 1000;
const DETAIL_TTL_MS = 60 * 60 * 1000;

function shouldUseCache(): boolean {
  return !(process.env.VITEST || process.env.NODE_ENV === "test");
}

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

type CachePayload<T> = {
  createdAt: string;
  value: T;
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

function getCachePath(namespace: string, key: string): string {
  const hash = createHash("sha256").update(`${namespace}:${key}`).digest("hex");
  return path.join(CACHE_ROOT, `${hash}.json`);
}

async function readCache<T>(namespace: string, key: string, ttlMs: number): Promise<T | null> {
  if (!shouldUseCache()) return null;
  const cachePath = getCachePath(namespace, key);

  try {
    const fileStats = await stat(cachePath);
    if (Date.now() - fileStats.mtimeMs > ttlMs) {
      return null;
    }

    const raw = await readFile(cachePath, "utf8");
    return (JSON.parse(raw) as CachePayload<T>).value;
  } catch {
    return null;
  }
}

async function writeCache<T>(namespace: string, key: string, value: T): Promise<void> {
  if (!shouldUseCache()) return;
  await mkdir(CACHE_ROOT, { recursive: true });
  const cachePath = getCachePath(namespace, key);
  const payload: CachePayload<T> = {
    createdAt: new Date().toISOString(),
    value,
  };

  await writeFile(cachePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function listPokemons(limit: number, offset: number): Promise<PokemonListItem[]> {
  const cacheKey = `${limit}:${offset}`;
  const cached = await readCache<PokemonListItem[]>("list", cacheKey, LIST_TTL_MS);
  if (cached) return cached;

  const url = `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`PokéAPI retornou ${res.status}`);
  }

  const data = (await res.json()) as PokemonListResponse;
  const result = data.results.map((pokemon) => ({ name: pokemon.name, url: pokemon.url }));

  await writeCache("list", cacheKey, result);
  return result;
}

export async function getPokemon(nameOrId: string): Promise<PokemonDetailResult> {
  const cacheKey = nameOrId.toLowerCase();
  const cached = await readCache<PokemonDetailResult>("detail", cacheKey, DETAIL_TTL_MS);
  if (cached) return cached;

  const url = `${POKEAPI_BASE}/pokemon/${nameOrId}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`PokéAPI retornou ${res.status} para "${nameOrId}"`);
  }

  const data = (await res.json()) as PokemonDetail;
  const result: PokemonDetailResult = {
    id: data.id,
    name: data.name,
    sprite: data.sprites.front_default,
    types: data.types.map((type) => type.type.name),
    stats: data.stats.map((stat) => ({ name: stat.stat.name, base: stat.base_stat })),
  };

  await writeCache("detail", cacheKey, result);
  return result;
}
