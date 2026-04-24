#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

async function listPokemons(limit: number, offset: number): Promise<string> {
  const url = `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokéAPI retornou ${res.status}`);
  const data = (await res.json()) as PokemonListResponse;
  return JSON.stringify(
    data.results.map((p) => ({
      name: p.name,
      url: p.url,
    })),
    null,
    2,
  );
}

async function getPokemon(nameOrId: string): Promise<string> {
  const url = `${POKEAPI_BASE}/pokemon/${nameOrId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokéAPI retornou ${res.status} para "${nameOrId}"`);
  const data = (await res.json()) as PokemonDetail;
  return JSON.stringify(
    {
      id: data.id,
      name: data.name,
      sprite: data.sprites.front_default,
      types: data.types.map((t) => t.type.name),
      stats: data.stats.map((s) => ({ name: s.stat.name, base: s.base_stat })),
    },
    null,
    2,
  );
}

const server = new McpServer({
  name: "pokemon-server",
  version: "1.0.0",
});

server.tool(
  "list_pokemons",
  {
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
  },
  async ({ limit, offset }) => {
    const text = await listPokemons(limit, offset);
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "get_pokemon",
  {
    name_or_id: z.string().min(1),
  },
  async ({ name_or_id }) => {
    const text = await getPokemon(name_or_id);
    return { content: [{ type: "text", text }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
