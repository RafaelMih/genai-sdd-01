#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildContextCacheKey,
  readContextCache,
  writeContextCache,
  type ContextIntent,
} from "./context-cache.js";
import { recordContextTelemetry } from "./context-telemetry.js";
import { checkSpecForBlockers, formatBlockerError } from "./spec-lint-blockers.js";

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

type FeatureArtifacts = {
  context: string | null;
  traceabilitySummary: string | null;
};

const CHUNKS_PATH = path.resolve("specs", ".index", "spec-chunks.json");
const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");
const MAX_CONTEXT_CHUNKS = 4;
const FULL_BUDGET_HARD_BLOCK = 6000;
const INTENT_BUDGETS: Record<ContextIntent, number> = {
  implement: 700,
  test: 900,
  review: 1000,
  drift: 900,
};
const VALID_INTENTS: ContextIntent[] = ["implement", "test", "review", "drift"];

function isIntent(value: string | undefined): value is ContextIntent {
  return value !== undefined && VALID_INTENTS.includes(value as ContextIntent);
}

const feature = process.argv[2];
const secondArg = process.argv[3];
const thirdArg = process.argv[4];
const version = isIntent(secondArg) ? undefined : secondArg;
const intent: ContextIntent = isIntent(secondArg)
  ? secondArg
  : isIntent(thirdArg)
    ? thirdArg
    : "implement";

if (!feature) {
  console.error(`
Missing feature argument

Usage:
  npm run ai:context <feature> [version] [intent]
  npm run ai:context <feature> [intent]

Examples:
  npm run ai:context auth
  npm run ai:context auth implement
  npm run ai:context auth 1.1.3 test
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

async function loadFeatureArtifacts(featureName: string): Promise<FeatureArtifacts> {
  const [context, traceabilitySummary] = await Promise.all([
    readFile(path.resolve("specs", "features", featureName, "CONTEXT.md"), "utf8").catch(() => null),
    readFile(
      path.resolve("specs", "features", featureName, "TRACEABILITY-SUMMARY.md"),
      "utf8",
    ).catch(() => null),
  ]);

  return { context, traceabilitySummary };
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

function needsTraceabilitySummary(currentIntent: ContextIntent): boolean {
  return currentIntent === "test" || currentIntent === "review" || currentIntent === "drift";
}

function scoreChunk(
  chunk: SpecChunk,
  featureName: string,
  relatedSpecIds: Set<string>,
  currentIntent: ContextIntent,
  targetVersion?: string,
): number {
  let score = 0;

  if (!relatedSpecIds.has(chunk.specId) && chunk.feature !== featureName) {
    return -1_000;
  }

  if (chunk.feature === featureName) score += 100;
  if (relatedSpecIds.has(chunk.specId)) score += 60;
  if (chunk.type === "feature") score += 20;
  if (targetVersion && chunk.version === targetVersion) score += 40;
  if (targetVersion && chunk.version !== targetVersion) score -= 100;

  const section = `${chunk.section} ${chunk.heading}`.toLowerCase();

  const intentWeights: Record<ContextIntent, Array<[RegExp, number]>> = {
    implement: [
      [/contract|schema|validation|error messages|write|read/i, 65],
      [/dependencies|integration/i, 30],
      [/user flow|redirect|route/i, 25],
      [/tests?/i, 10],
      [/objective|scope|acceptance criteria/i, 5],
    ],
    test: [
      [/acceptance criteria|tests?|traceability/i, 70],
      [/contract|validation|error messages/i, 35],
      [/dependencies|user flow|redirect/i, 20],
    ],
    review: [
      [/acceptance criteria|contract|validation|schema/i, 55],
      [/dependencies|open questions|changelog|decision/i, 35],
      [/tests?|traceability|redirect|route/i, 25],
    ],
    drift: [
      [/contract|validation|schema|write|read/i, 55],
      [/redirect|route|navigation|user flow/i, 50],
      [/traceability|tests?|acceptance criteria/i, 30],
      [/dependencies/i, 20],
    ],
  };

  for (const [pattern, weight] of intentWeights[currentIntent]) {
    if (pattern.test(section)) score += weight;
  }

  score -= Math.floor(chunk.tokens / 60);

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

function estimateTokens(content: string): number {
  return Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.3);
}

function maxChunksForIntent(currentIntent: ContextIntent): number {
  return currentIntent === "implement" ? 2 : MAX_CONTEXT_CHUNKS;
}

async function main() {
  const invocationId = randomUUID();
  const startedAt = Date.now();
  const [chunks, manifest, featureArtifacts] = await Promise.all([
    loadChunks(),
    loadManifest(),
    loadFeatureArtifacts(feature),
  ]);
  const targetSpec = resolveTargetSpec(manifest, feature, version);

  if (!targetSpec) {
    throw new Error(
      `No feature spec manifest entry found for "${feature}"${version ? ` v${version}` : ""}.`,
    );
  }

  const specContent = await readFile(path.resolve(targetSpec.path), "utf8");
  const blockers = checkSpecForBlockers(specContent);
  if (blockers.length > 0) {
    throw new Error(formatBlockerError(feature, blockers));
  }

  const relatedSpecIds = new Set<string>([targetSpec.id, ...(targetSpec.dependsOn ?? [])]);
  const relatedSpecPaths = manifest
    .filter((entry) => relatedSpecIds.has(entry.id))
    .map((entry) => path.resolve(entry.path));
  const cacheFiles = [CHUNKS_PATH, MANIFEST_PATH, ...relatedSpecPaths];

  if (featureArtifacts.context) {
    cacheFiles.push(path.resolve("specs", "features", feature, "CONTEXT.md"));
  }

  if (needsTraceabilitySummary(intent) && featureArtifacts.traceabilitySummary) {
    cacheFiles.push(path.resolve("specs", "features", feature, "TRACEABILITY-SUMMARY.md"));
  }

  if (intent === "review" || intent === "drift") {
    cacheFiles.push(path.resolve("specs", "features", feature, "TRACEABILITY.md"));
  }

  if (intent === "review") {
    cacheFiles.push(path.resolve("specs", "features", feature, "changelog.md"));
  }

  const cacheKey = await buildContextCacheKey({
    feature,
    version: targetSpec.version ?? version ?? null,
    mode: "chunked",
    intent,
    scope: "canonical-context",
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
      intent,
      mode: "chunked",
      status: "cached",
      durationMs: Date.now() - startedAt,
      chunkCount: Number(cached.metadata.chunkCount ?? 0),
      estimatedTokens: Number(cached.metadata.estimatedTokens ?? 0),
      budgetLimit: INTENT_BUDGETS[intent],
      budgetExceeded: Boolean(cached.metadata.budgetExceeded),
      cacheKey,
      relatedSpecs: [...relatedSpecIds],
      servedBlocks: String(cached.metadata.servedBlocks ?? "")
        .split(",")
        .filter(Boolean),
    });
    console.log(cached.content);
    return;
  }

  const rankedChunks = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, feature, relatedSpecIds, intent, targetSpec.version ?? version),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.chunk);

  const relevantChunks: SpecChunk[] = [];
  let totalChunkTokens = 0;

  for (const chunk of rankedChunks) {
    if (relevantChunks.length >= maxChunksForIntent(intent)) break;
    if (relevantChunks.length > 0 && totalChunkTokens + chunk.tokens > INTENT_BUDGETS[intent]) {
      continue;
    }

    relevantChunks.push(chunk);
    totalChunkTokens += chunk.tokens;
  }

  const sections: string[] = [];
  const servedBlocks: string[] = [];

  if (featureArtifacts.context) {
    sections.push(`Canonical feature context:\n\n${featureArtifacts.context}`);
    servedBlocks.push("context");
  }

  const contextWithTraceability = `Traceability summary:\n\n${featureArtifacts.traceabilitySummary}`;
  if (needsTraceabilitySummary(intent) && featureArtifacts.traceabilitySummary) {
    const candidate = [...sections, contextWithTraceability].join("\n\n---\n\n");
    if (sections.length === 0 || estimateTokens(candidate) <= INTENT_BUDGETS[intent]) {
      sections.push(contextWithTraceability);
      servedBlocks.push("traceability-summary");
    }
  }

  if (relevantChunks.length > 0) {
    const candidate = [
      ...sections,
      `Relevant spec sections:\n\n${relevantChunks.map(formatChunk).join("\n\n---\n\n")}`,
    ].join("\n\n---\n\n");
    if (sections.length === 0 || estimateTokens(candidate) <= INTENT_BUDGETS[intent]) {
      sections.push(
        `Relevant spec sections:\n\n${relevantChunks.map(formatChunk).join("\n\n---\n\n")}`,
      );
      servedBlocks.push("chunked-sections");
    }
  }

  if (sections.length === 0) {
    throw new Error(
      `No context could be assembled for "${feature}"${version ? ` v${version}` : ""}.`,
    );
  }

  const body = sections.join("\n\n---\n\n");
  const output = `
You are implementing a Spec Driven Development task.

Use ONLY the following specs as source of truth.
If something is missing, stop and ask for spec clarification.
Do not invent routes, fields, validations, schemas, UI behavior, business rules, or tests.

Feature: ${feature}
Version: ${targetSpec.version ?? version ?? "latest/relevant"}
Intent: ${intent}
Context budget: ${INTENT_BUDGETS[intent]} estimated tokens

${body}
`;
  const outputTokens = estimateTokens(output);
  const budgetExceeded = outputTokens > INTENT_BUDGETS[intent];

  if (outputTokens > FULL_BUDGET_HARD_BLOCK) {
    throw new Error(
      `Context hard block: estimated ${outputTokens} tokens exceeds the ${FULL_BUDGET_HARD_BLOCK}-token limit. Reduce chunk count or use a more specific intent.`,
    );
  }

  const warningPrefix = budgetExceeded
    ? `Budget warning: estimated context tokens (${outputTokens}) exceeded the ${INTENT_BUDGETS[intent]}-token budget for intent "${intent}". Prefer CONTEXT.md only or a narrower query.\n\n`
    : "";
  const finalOutput = `${warningPrefix}${output.trimStart()}`;

  await writeContextCache({
    cacheKey,
    content: finalOutput,
    metadata: {
      chunkCount: servedBlocks.includes("chunked-sections") ? relevantChunks.length : 0,
      estimatedTokens: outputTokens,
      budgetExceeded,
      servedBlocks: servedBlocks.join(","),
    },
  });

  await recordContextTelemetry({
    invocationId,
    timestamp: new Date().toISOString(),
    source: "ai-context",
    origin: "npm run ai:context",
    feature,
    version: targetSpec.version ?? version ?? null,
    intent,
    mode: "chunked",
    status: budgetExceeded ? "warning" : "generated",
    durationMs: Date.now() - startedAt,
    chunkCount: servedBlocks.includes("chunked-sections") ? relevantChunks.length : 0,
    estimatedTokens: outputTokens,
    budgetLimit: INTENT_BUDGETS[intent],
    budgetExceeded,
    cacheKey,
    relatedSpecs: [...relatedSpecIds],
    servedBlocks,
  });

  console.error(
    `[context-id: ${invocationId}] Para avaliar este contexto: npm run rag:feedback -- ${invocationId} up|down [too-large|missing-contract|missing-test|redundant-traceability]`,
  );
  console.log(finalOutput);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
