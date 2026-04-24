#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { buildContextCacheKey, readContextCache, writeContextCache } from "./context-cache.js";
import { recordContextTelemetry } from "./context-telemetry.js";

type SpecType = "product" | "technical" | "decision" | "feature";

type SpecManifestEntry = {
  id: string;
  path: string;
  type: SpecType;
  feature?: string;
  version?: string;
  status?: "active" | "superseded" | "archived";
  dependsOn?: string[];
};

type SpecChunk = {
  id: string;
  specId: string;
  path: string;
  type: SpecType;
  feature?: string;
  version?: string;
  section: string;
  heading: string;
  content: string;
  tokens: number;
};

const CHUNKS_PATH = path.resolve("specs", ".index", "spec-chunks.json");
const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");
const MAX_CONTEXT_CHUNKS = 6;
const MAX_CONTEXT_TOKENS = 900;
const SUMMARY_BUDGET_TOKENS = 1400;

const feature = process.argv[2];
const version = process.argv[3];

if (!feature) {
  console.error(`
Missing feature argument

Usage:
  npm run ai:context <feature> [version]

Examples:
  npm run ai:context auth
  npm run ai:context auth 1.0.0
`);

  process.exit(1);
}

async function loadChunks(): Promise<SpecChunk[]> {
  const raw = await readFile(CHUNKS_PATH, "utf8");
  return JSON.parse(raw) as SpecChunk[];
}

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return (JSON.parse(raw) as SpecManifestEntry[]).filter((entry) => entry.status !== "archived");
}

async function loadFeatureContext(featureName: string): Promise<string | null> {
  const contextPath = path.resolve("specs", "features", featureName, "CONTEXT.md");

  try {
    return await readFile(contextPath, "utf8");
  } catch {
    return null;
  }
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) return leftPart - rightPart;
  }

  return 0;
}

function resolveTargetSpec(
  manifest: SpecManifestEntry[],
  featureName: string,
  targetVersion?: string,
): SpecManifestEntry | null {
  const candidates = manifest
    .filter((entry) => entry.type === "feature" && entry.feature === featureName)
    .filter((entry) => (targetVersion ? entry.version === targetVersion : true))
    .sort((left, right) => compareVersions(right.version ?? "0.0.0", left.version ?? "0.0.0"));

  return candidates[0] ?? null;
}

function scoreChunk(
  chunk: SpecChunk,
  featureName: string,
  relatedSpecIds: Set<string>,
  targetVersion?: string,
): number {
  let score = 0;

  if (!relatedSpecIds.has(chunk.specId) && chunk.feature !== featureName) {
    return -1_000;
  }

  if (chunk.feature === featureName) score += 100;
  if (relatedSpecIds.has(chunk.specId)) score += 60;

  if (targetVersion && chunk.version === targetVersion) score += 40;
  if (targetVersion && chunk.version !== targetVersion) score -= 100;

  if (chunk.type === "feature") score += 25;
  if (chunk.type === "technical") score += 10;

  if (/objective/i.test(chunk.section)) score += 20;
  if (/scope/i.test(chunk.section)) score += 20;
  if (/out of scope/i.test(chunk.section)) score += 15;
  if (/acceptance criteria/i.test(chunk.section)) score += 45;
  if (/contracts?/i.test(chunk.section)) score += 35;
  if (/dependencies/i.test(chunk.section)) score += 25;
  if (/open questions/i.test(chunk.section)) score += 25;
  if (/user flow/i.test(chunk.section)) score += 20;
  if (/tests?/i.test(chunk.section)) score += 10;

  score -= Math.floor(chunk.tokens / 80);

  return score;
}

function formatChunk(chunk: SpecChunk): string {
  return `## ${chunk.specId}
Path: ${chunk.path}
Type: ${chunk.type}
Feature: ${chunk.feature ?? "N/A"}
Version: ${chunk.version ?? "N/A"}
Section: ${chunk.section}

${chunk.content}`;
}

async function main() {
  const invocationId = randomUUID();
  const startedAt = Date.now();
  const [chunks, manifest, featureContext] = await Promise.all([
    loadChunks(),
    loadManifest(),
    loadFeatureContext(feature),
  ]);
  const targetSpec = resolveTargetSpec(manifest, feature, version);

  if (!targetSpec) {
    throw new Error(
      `No feature spec manifest entry found for "${feature}"${version ? ` v${version}` : ""}.`,
    );
  }

  const relatedSpecIds = new Set<string>([targetSpec.id, ...(targetSpec.dependsOn ?? [])]);
  const relatedSpecPaths = manifest
    .filter((entry) => relatedSpecIds.has(entry.id))
    .map((entry) => path.resolve(entry.path));
  const cacheFiles = [
    CHUNKS_PATH,
    MANIFEST_PATH,
    ...relatedSpecPaths,
    path.resolve("specs", "features", feature, "TRACEABILITY.md"),
    path.resolve("specs", "features", feature, "changelog.md"),
  ];
  if (featureContext) {
    cacheFiles.push(path.resolve("specs", "features", feature, "CONTEXT.md"));
  }

  const cacheKey = await buildContextCacheKey({
    feature,
    version: targetSpec.version ?? version ?? null,
    mode: "chunked",
    files: cacheFiles,
  });
  const cached = await readContextCache(cacheKey);

  if (cached) {
    await recordContextTelemetry({
      invocationId,
      timestamp: new Date().toISOString(),
      source: "ai-context",
      origin: "npm run ai:context",
      feature,
      version: targetSpec.version ?? version ?? null,
      mode: "chunked",
      status: "cached",
      durationMs: Date.now() - startedAt,
      chunkCount: Number(cached.metadata.chunkCount ?? 0),
      estimatedTokens: Number(cached.metadata.estimatedTokens ?? 0),
      budgetLimit: MAX_CONTEXT_TOKENS,
      budgetExceeded: Boolean(cached.metadata.budgetExceeded),
      cacheKey,
      relatedSpecs: [...relatedSpecIds],
    });
    console.log(cached.content);
    return;
  }

  const rankedChunks = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, feature, relatedSpecIds, targetSpec.version ?? version),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.chunk);

  const relevantChunks: SpecChunk[] = [];
  let totalTokens = 0;

  for (const chunk of rankedChunks) {
    if (relevantChunks.length >= MAX_CONTEXT_CHUNKS) break;
    if (relevantChunks.length > 0 && totalTokens + chunk.tokens > MAX_CONTEXT_TOKENS) continue;

    relevantChunks.push(chunk);
    totalTokens += chunk.tokens;
  }

  if (relevantChunks.length === 0) {
    throw new Error(
      `No relevant spec chunks found for "${feature}"${
        version ? ` v${version}` : ""
      }. Run npm run index:specs or check your specs.`,
    );
  }

  const context = relevantChunks.map(formatChunk).join("\n\n---\n\n");
  const summaryPrefix = featureContext
    ? `Canonical feature context:\n\n${featureContext}\n\n---\n\n`
    : "";
  const budgetExceeded = totalTokens > MAX_CONTEXT_TOKENS || totalTokens > SUMMARY_BUDGET_TOKENS;
  const budgetWarning = budgetExceeded
    ? `Budget warning: estimated context tokens (${totalTokens}) exceeded the recommended budget.\n\n`
    : "";

  const output = `
${budgetWarning}You are implementing a Spec Driven Development task.

Use ONLY the following specs as source of truth.
If something is missing, stop and ask for spec clarification.
Do not invent routes, fields, validations, schemas, UI behavior, business rules, or tests.

Feature: ${feature}
Version: ${targetSpec.version ?? version ?? "latest/relevant"}
Context budget: ${totalTokens} estimated tokens across ${relevantChunks.length} chunks

Relevant specs:

${summaryPrefix}${context}
`;

  await writeContextCache({
    cacheKey,
    content: output,
    metadata: {
      chunkCount: relevantChunks.length + (featureContext ? 1 : 0),
      estimatedTokens: totalTokens,
      budgetExceeded,
    },
  });

  await recordContextTelemetry({
    invocationId,
    timestamp: new Date().toISOString(),
    source: "ai-context",
    origin: "npm run ai:context",
    feature,
    version: targetSpec.version ?? version ?? null,
    mode: "chunked",
    status: budgetExceeded ? "warning" : "generated",
    durationMs: Date.now() - startedAt,
    chunkCount: relevantChunks.length + (featureContext ? 1 : 0),
    estimatedTokens: totalTokens,
    budgetLimit: MAX_CONTEXT_TOKENS,
    budgetExceeded,
    cacheKey,
    relatedSpecs: [...relatedSpecIds],
  });

  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
