#!/usr/bin/env node
import { createServer } from "node:http";
import process from "node:process";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};

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

async function listPokemons(limit: number, offset: number) {
  const url = `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokéAPI retornou ${res.status}`);
  const data = (await res.json()) as PokemonListResponse;
  return data.results.map((p) => ({ name: p.name, url: p.url }));
}

async function getPokemon(nameOrId: string) {
  const url = `${POKEAPI_BASE}/pokemon/${nameOrId}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`PokéAPI retornou ${res.status} para "${nameOrId}"`);
  const data = (await res.json()) as PokemonDetail;
  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites.front_default,
    types: data.types.map((t) => t.type.name),
    stats: data.stats.map((s) => ({ name: s.stat.name, base: s.base_stat })),
  };
}

async function handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  try {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            serverInfo: { name: "pokemon-server", version: "1.0.0" },
            capabilities: { tools: {} },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            tools: [
              {
                name: "list_pokemons",
                description: "Lista Pokémons da PokéAPI com suporte a paginação.",
                inputSchema: {
                  type: "object",
                  properties: {
                    limit: { type: "number" },
                    offset: { type: "number" },
                  },
                  required: [],
                },
              },
              {
                name: "get_pokemon",
                description: "Retorna detalhes de um Pokémon por nome ou ID.",
                inputSchema: {
                  type: "object",
                  properties: {
                    name_or_id: { type: "string" },
                  },
                  required: ["name_or_id"],
                },
              },
            ],
          },
        };

      case "tools/call": {
        const name = String(request.params?.name ?? "");
        const args = (request.params?.arguments ?? {}) as Record<string, unknown>;

        let result: unknown;

        if (name === "list_pokemons") {
          const limit = typeof args.limit === "number" ? args.limit : 20;
          const offset = typeof args.offset === "number" ? args.offset : 0;
          result = await listPokemons(limit, offset);
        } else if (name === "get_pokemon") {
          const nameOrId = String(args.name_or_id ?? "");
          if (!nameOrId) throw new Error('Missing "name_or_id" parameter.');
          result = await getPokemon(nameOrId);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        };
      }

      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  } catch (error: unknown) {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

const port = Number(process.env.PORT ?? 3101);

createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const chunks: Buffer[] = [];
  req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  req.on("end", async () => {
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      const request = JSON.parse(body) as JsonRpcRequest;
      const response = await handleRequest(request);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response));
    } catch (error: unknown) {
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: error instanceof Error ? error.message : String(error),
        },
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response));
    }
  });
}).listen(port, () => {
  console.log(`pokemon-server listening on http://localhost:${port}`);
});
