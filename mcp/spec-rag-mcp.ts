#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

type SpecManifestEntry = {
  id: string;
  path: string;
  type: "product" | "technical" | "decision" | "feature";
  feature?: string;
  version?: string;
  dependsOn?: string[];
};

const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");

// -------------------- IO --------------------

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as SpecManifestEntry[];
}

async function readSpecFile(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), "utf8");
}

// -------------------- CORE LOGIC --------------------

function rankEntries(
  entries: SpecManifestEntry[],
  feature: string,
  version?: string,
): SpecManifestEntry[] {
  return entries
    .filter((entry) => entry.feature === feature || entry.id === feature)
    .filter((entry) => (version ? entry.version === version : true))
    .sort((a, b) => {
      // feature spec sempre primeiro
      if (a.type === "feature" && b.type !== "feature") return -1;
      if (a.type !== "feature" && b.type === "feature") return 1;

      return a.path.localeCompare(b.path);
    });
}

async function retrieveRelevantSpecs(feature: string, version?: string) {
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

  return documents
    .map(
      (doc) => `# ${doc.id}
Path: ${doc.path}
Type: ${doc.type}
Version: ${doc.version}

${doc.content}`,
    )
    .join("\n\n---\n\n");
}

// -------------------- MCP SERVER --------------------

const server = new McpServer({
  name: "spec-rag-server",
  version: "1.0.0",
});

server.registerTool(
  "retrieve_relevant_specs",
  {
    title: "Retrieve Relevant Specs",
    description: "Recupera specs relevantes (feature + dependências) a partir do manifest.",
    inputSchema: {
      feature: z.string().min(1),
      version: z.string().optional(),
    },
  },
  async ({ feature, version }) => {
    const result = await retrieveRelevantSpecs(feature, version);

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

// -------------------- TRANSPORT --------------------

const transport = new StdioServerTransport();
await server.connect(transport);
