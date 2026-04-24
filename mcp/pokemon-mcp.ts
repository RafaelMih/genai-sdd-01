#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPokemon, listPokemons } from "./pokemon-service.js";

const server = new McpServer({
  name: "pokemon-server",
  version: "1.0.0",
});

server.registerTool(
  "list_pokemons",
  {
    title: "List Pokemons",
    description: "Lista Pokémons da PokéAPI com paginação.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).optional().default(20),
      offset: z.number().int().min(0).optional().default(0),
    },
  },
  async ({ limit, offset }) => {
    const result = await listPokemons(limit, offset);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "get_pokemon",
  {
    title: "Get Pokemon",
    description: "Retorna detalhes de um Pokémon por nome ou ID.",
    inputSchema: {
      name_or_id: z.string().min(1),
    },
  },
  async ({ name_or_id }) => {
    const result = await getPokemon(name_or_id);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
