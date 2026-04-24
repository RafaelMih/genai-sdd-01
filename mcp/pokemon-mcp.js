#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";
async function listPokemons(limit, offset) {
    const url = `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`PokéAPI retornou ${res.status}`);
    }
    const data = (await res.json());
    return data.results.map((p) => ({
        name: p.name,
        url: p.url,
    }));
}
async function getPokemon(nameOrId) {
    const url = `${POKEAPI_BASE}/pokemon/${nameOrId}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`PokéAPI retornou ${res.status} para "${nameOrId}"`);
    }
    const data = (await res.json());
    return {
        id: data.id,
        name: data.name,
        sprite: data.sprites.front_default,
        types: data.types.map((t) => t.type.name),
        stats: data.stats.map((s) => ({
            name: s.stat.name,
            base: s.base_stat,
        })),
    };
}
const server = new McpServer({
    name: "pokemon-server",
    version: "1.0.0",
});
server.registerTool("list_pokemons", {
    title: "List Pokemons",
    description: "Lista Pokémons da PokéAPI com paginação.",
    inputSchema: {
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
    },
}, async ({ limit, offset }) => {
    const result = await listPokemons(limit, offset);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
});
server.registerTool("get_pokemon", {
    title: "Get Pokemon",
    description: "Retorna detalhes de um Pokémon por nome ou ID.",
    inputSchema: {
        name_or_id: z.string().min(1),
    },
}, async ({ name_or_id }) => {
    const result = await getPokemon(name_or_id);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
