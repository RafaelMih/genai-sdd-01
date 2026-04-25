#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  buildContextCacheKey,
  readContextCache,
  writeContextCache,
  type ContextIntent,
} from "../scripts/context-cache.js";
import { recordContextTelemetry } from "../scripts/context-telemetry.js";
import { checkSpecForBlockers, formatBlockerError } from "../scripts/spec-lint-blockers.js";

type SpecManifestEntry = {
  id: string;
  path: string;
  type: "product" | "technical" | "decision" | "feature";
  feature?: string;
  version?: string;
  status?: "active" | "superseded" | "archived";
  dependsOn?: string[];
};

type FeatureArtifacts = {
  context: string | null;
  traceabilitySummary: string | null;
};

const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");
const SUMMARY_BUDGET_TOKENS = 1400;
const FULL_BUDGET_TOKENS = 4000;
const FULL_BUDGET_HARD_BLOCK = 6000;
const VALID_INTENTS: ContextIntent[] = ["implement", "test", "review", "drift"];

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function needsTraceabilitySummary(intent: ContextIntent): boolean {
  return intent === "test" || intent === "review" || intent === "drift";
}

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return (JSON.parse(raw) as SpecManifestEntry[]).filter((entry) => entry.status !== "archived");
}

async function readSpecFile(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), "utf8");
}

async function readFeatureArtifacts(feature: string): Promise<FeatureArtifacts> {
  const [context, traceabilitySummary] = await Promise.all([
    readFile(path.resolve("specs", "features", feature, "CONTEXT.md"), "utf8").catch(() => null),
    readFile(
      path.resolve("specs", "features", feature, "TRACEABILITY-SUMMARY.md"),
      "utf8",
    ).catch(() => null),
  ]);

  return { context, traceabilitySummary };
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

function buildSummary(
  entry: SpecManifestEntry,
  content: string,
  intent: ContextIntent,
  isPrimaryFeature: boolean,
): string {
  const sections = getSections(content);
  const headingOrder: Record<ContextIntent, string[]> = {
    implement: ["Objective", "Scope", "Acceptance criteria", "Validation contract", "Read contract", "Write contract", "Redirect contract", "Dependencies"],
    test: ["Acceptance criteria", "Tests", "Validation contract", "Error messages contract", "Redirect contract"],
    review: ["Objective", "Scope", "Acceptance criteria", "Validation contract", "Read contract", "Write contract", "Dependencies", "Open questions"],
    drift: ["Acceptance criteria", "Read contract", "Write contract", "Redirect contract", "User flow", "Dependencies"],
  };

  const maxSections = isPrimaryFeature ? 4 : 2;
  const preferred = headingOrder[intent]
    .map((heading) =>
      sections.find((section) => section.heading.toLowerCase() === heading.toLowerCase()),
    )
    .filter((section): section is { heading: string; body: string } => Boolean(section))
    .slice(0, maxSections);

  const selectedSections = preferred.length > 0 ? preferred : sections.slice(0, maxSections);

  return selectedSections.map((section) => `## ${section.heading}\n${section.body}`).join("\n\n");
}

function estimateTokens(content: string): number {
  return Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.3);
}

async function retrieveRelevantSpecs(
  feature: string,
  version?: string,
  detail: "summary" | "full" = "summary",
  intent: ContextIntent = "implement",
) {
  const invocationId = randomUUID();
  const startedAt = Date.now();
  const manifest = await loadManifest();
  const ranked = rankEntries(manifest, feature, version);

  const featureSpec = ranked.find((entry) => entry.type === "feature");

  if (!featureSpec) {
    throw new Error(`No feature spec found for "${feature}"${version ? ` v${version}` : ""}.`);
  }

  const featureSpecContent = await readSpecFile(featureSpec.path);
  const blockers = checkSpecForBlockers(featureSpecContent);
  if (blockers.length > 0) {
    throw new Error(formatBlockerError(feature, blockers));
  }

  const relatedIds = new Set<string>([featureSpec.id, ...(featureSpec.dependsOn ?? [])]);
  const relatedEntries = manifest.filter((entry) => relatedIds.has(entry.id));
  const featureArtifacts = await readFeatureArtifacts(feature);
  const cacheFiles = [MANIFEST_PATH, ...relatedEntries.map((entry) => path.resolve(entry.path))];

  if (featureArtifacts.context) {
    cacheFiles.push(path.resolve("specs", "features", feature, "CONTEXT.md"));
  }

  if (needsTraceabilitySummary(intent) && featureArtifacts.traceabilitySummary) {
    cacheFiles.push(path.resolve("specs", "features", feature, "TRACEABILITY-SUMMARY.md"));
  }

  if (intent === "review") {
    cacheFiles.push(path.resolve("specs", "features", feature, "changelog.md"));
  }

  const cacheKey = await buildContextCacheKey({
    feature,
    version: featureSpec.version ?? version ?? null,
    mode: detail,
    intent,
    scope: "section-summary",
    files: cacheFiles,
  });
  const cached = await readContextCache(cacheKey);

  if (cached) {
    await recordContextTelemetry({
      invocationId,
      timestamp: new Date().toISOString(),
      source: "spec-rag-mcp",
      origin: "retrieve_relevant_specs",
      feature,
      version: featureSpec.version ?? version ?? null,
      intent,
      mode: detail,
      status: "cached",
      durationMs: Date.now() - startedAt,
      chunkCount: Number(cached.metadata.chunkCount ?? 0),
      estimatedTokens: Number(cached.metadata.estimatedTokens ?? 0),
      budgetLimit: Number(cached.metadata.budgetLimit ?? 0),
      budgetExceeded: Boolean(cached.metadata.budgetExceeded),
      cacheKey,
      relatedSpecs: [...relatedIds],
      servedBlocks: String(cached.metadata.servedBlocks ?? "")
        .split(",")
        .filter(Boolean),
    });
    return cached.content;
  }

  const documents = await Promise.all(
    relatedEntries.map(async (entry) => ({
      entry,
      content: await readSpecFile(entry.path),
    })),
  );

  const sections: string[] = [];
  const servedBlocks: string[] = [];

  if (featureArtifacts.context) {
    sections.push(`# feature-context
Path: specs/features/${feature}/CONTEXT.md
Type: feature-context
Version: ${featureSpec.version ?? null}

${featureArtifacts.context}`);
    servedBlocks.push("context");
  }

  if (needsTraceabilitySummary(intent) && featureArtifacts.traceabilitySummary) {
    sections.push(`# traceability-summary
Path: specs/features/${feature}/TRACEABILITY-SUMMARY.md
Type: traceability-summary
Version: ${featureSpec.version ?? null}

${featureArtifacts.traceabilitySummary}`);
    servedBlocks.push("traceability-summary");
  }

  sections.push(
    documents
      .map(
        ({ entry, content }) => `# ${entry.id}
Path: ${entry.path}
Type: ${entry.type}
Version: ${entry.version ?? null}

${
  detail === "full"
    ? content
    : buildSummary(entry, content, intent, entry.id === featureSpec.id)
}`,
      )
      .join("\n\n---\n\n"),
  );
  servedBlocks.push(detail === "full" ? "full-specs" : "section-summary");

  const payload = sections.join("\n\n---\n\n");
  const estimatedTokens = estimateTokens(payload);
  const budgetLimit = detail === "full" ? FULL_BUDGET_TOKENS : SUMMARY_BUDGET_TOKENS;
  const budgetExceeded = estimatedTokens > budgetLimit;

  if (detail === "full" && estimatedTokens > FULL_BUDGET_HARD_BLOCK) {
    throw new Error(
      `Full mode hard block: estimated ${estimatedTokens} tokens exceeds the ${FULL_BUDGET_HARD_BLOCK}-token limit. Use intent-aware summary mode instead.`,
    );
  }

  await writeContextCache({
    cacheKey,
    content: payload,
    metadata: {
      chunkCount: documents.length,
      estimatedTokens,
      budgetLimit,
      budgetExceeded,
      servedBlocks: servedBlocks.join(","),
    },
  });
  await recordContextTelemetry({
    invocationId,
    timestamp: new Date().toISOString(),
    source: "spec-rag-mcp",
    origin: "retrieve_relevant_specs",
    feature,
    version: featureSpec.version ?? version ?? null,
    intent,
    mode: detail,
    status: budgetExceeded ? "warning" : "generated",
    durationMs: Date.now() - startedAt,
    chunkCount: documents.length,
    estimatedTokens,
    budgetLimit,
    budgetExceeded,
    cacheKey,
    relatedSpecs: [...relatedIds],
    servedBlocks,
  });

  return payload;
}

const server = new McpServer({
  name: "spec-rag-server",
  version: "1.2.0",
});

server.registerTool(
  "retrieve_relevant_specs",
  {
    title: "Retrieve Relevant Specs",
    description: "Recupera specs relevantes do manifest com modo resumido ou completo e intencao explicita.",
    inputSchema: {
      feature: z.string().min(1),
      version: z.string().optional(),
      detail: z.enum(["summary", "full"]).optional().default("summary"),
      intent: z.enum(VALID_INTENTS).optional().default("implement"),
    },
  },
  async ({ feature, version, detail, intent }) => {
    const result = await retrieveRelevantSpecs(feature, version, detail, intent);

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
