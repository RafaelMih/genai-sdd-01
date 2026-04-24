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

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as SpecManifestEntry[];
}

async function readSpecFile(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), "utf8");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function getSections(markdown: string): Array<{ heading: string; body: string }> {
  const lines = normalizeWhitespace(markdown).split("\n");
  const sections: Array<{ heading: string; body: string }> = [];

  let currentHeading = "Document";
  let buffer: string[] = [];

  function flush() {
    const body = buffer.join("\n").trim();
    if (!body) return;
    sections.push({ heading: currentHeading, body });
    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);

    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      continue;
    }

    if (/^#\s+/.test(line)) continue;

    buffer.push(line);
  }

  flush();

  return sections;
}

function rankEntries(
  entries: SpecManifestEntry[],
  feature: string,
  version?: string,
): SpecManifestEntry[] {
  return entries
    .filter((entry) => entry.feature === feature || entry.id === feature)
    .filter((entry) => (version ? entry.version === version : true))
    .sort((left, right) => {
      if (left.type === "feature" && right.type !== "feature") return -1;
      if (left.type !== "feature" && right.type === "feature") return 1;
      return left.path.localeCompare(right.path);
    });
}

function buildSummary(entry: SpecManifestEntry, content: string): string {
  const sections = getSections(content);
  const preferredHeadings =
    entry.type === "feature"
      ? [
          "Objective",
          "Scope",
          "Out of scope",
          "Acceptance criteria",
          "Dependencies",
          "Open questions",
        ]
      : ["Decision", "Consequences", "Collections", "Dependencies", "Context"];

  const preferred = sections.filter((section) =>
    preferredHeadings.some(
      (heading) => heading.toLowerCase() === section.heading.toLowerCase(),
    ),
  );

  const selectedSections = (preferred.length > 0 ? preferred : sections.slice(0, 4)).slice(0, 6);

  if (selectedSections.length === 0) {
    return content.trim();
  }

  return selectedSections
    .map((section) => `## ${section.heading}\n${section.body}`)
    .join("\n\n");
}

async function retrieveRelevantSpecs(
  feature: string,
  version?: string,
  detail: "summary" | "full" = "summary",
) {
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
      entry,
      content: await readSpecFile(entry.path),
    })),
  );

  return documents
    .map(
      ({ entry, content }) => `# ${entry.id}
Path: ${entry.path}
Type: ${entry.type}
Version: ${entry.version ?? null}

${detail === "full" ? content : buildSummary(entry, content)}`,
    )
    .join("\n\n---\n\n");
}

const server = new McpServer({
  name: "spec-rag-server",
  version: "1.1.0",
});

server.registerTool(
  "retrieve_relevant_specs",
  {
    title: "Retrieve Relevant Specs",
    description: "Recupera specs relevantes do manifest com modo resumido ou completo.",
    inputSchema: {
      feature: z.string().min(1),
      version: z.string().optional(),
      detail: z.enum(["summary", "full"]).optional().default("summary"),
    },
  },
  async ({ feature, version, detail }) => {
    const result = await retrieveRelevantSpecs(feature, version, detail);

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

const transport = new StdioServerTransport();
await server.connect(transport);
