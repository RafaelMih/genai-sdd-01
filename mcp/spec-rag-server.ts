#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type SpecManifestEntry = {
  id: string;
  path: string;
  type: "product" | "technical" | "decision" | "feature";
  feature?: string;
  version?: string;
  dependsOn?: string[];
};

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

const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(raw) as SpecManifestEntry[];
  return parsed;
}

async function readSpecFile(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), "utf8");
}

function rankEntries(
  entries: SpecManifestEntry[],
  feature: string,
  version?: string,
): SpecManifestEntry[] {
  return entries
    .filter((entry) => entry.feature === feature || entry.id === feature)
    .filter((entry) => (version ? entry.version === version : true))
    .sort((a, b) => {
      if (a.type === "feature" && b.type !== "feature") return -1;
      if (a.type !== "feature" && b.type === "feature") return 1;
      return a.path.localeCompare(b.path);
    });
}

async function retrieveRelevantSpecs(params: Record<string, unknown>) {
  const feature = String(params.feature ?? "");
  const version = params.version ? String(params.version) : undefined;

  if (!feature) {
    throw new Error('Missing "feature" parameter.');
  }

  const manifest = await loadManifest();
  const ranked = rankEntries(manifest, feature, version);
  const featureSpec = ranked.find((entry) => entry.type === "feature");

  if (!featureSpec) {
    throw new Error(`No feature spec found for "${feature}"${version ? ` v${version}` : ""}.`);
  }

  const relatedIds = new Set<string>([featureSpec.id, ...(featureSpec.dependsOn ?? [])]);
  const relatedEntries = manifest.filter((entry) => relatedIds.has(entry.id));

  const documents = await Promise.all(
    relatedEntries.map(async (entry) => ({
      id: entry.id,
      path: entry.path,
      type: entry.type,
      version: entry.version ?? null,
      content: await readSpecFile(entry.path),
    })),
  );

  return {
    feature,
    version: version ?? featureSpec.version ?? null,
    documents,
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
            serverInfo: {
              name: "spec-rag-server",
              version: "1.0.0",
            },
            capabilities: {
              tools: {},
            },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            tools: [
              {
                name: "retrieve_relevant_specs",
                description:
                  "Load only the active feature spec and its declared dependencies from the spec manifest.",
                inputSchema: {
                  type: "object",
                  properties: {
                    feature: { type: "string" },
                    version: { type: "string" },
                  },
                  required: ["feature"],
                },
              },
            ],
          },
        };

      case "tools/call": {
        const name = String(request.params?.name ?? "");
        const argumentsObject = (request.params?.arguments ?? {}) as Record<string, unknown>;

        if (name !== "retrieve_relevant_specs") {
          throw new Error(`Unknown tool: ${name}`);
        }

        const result = await retrieveRelevantSpecs(argumentsObject);
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
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

const port = Number(process.env.PORT ?? 3100);

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
  console.log(`spec-rag-server listening on http://localhost:${port}`);
});
