#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

type ContextTelemetryEvent = {
  invocationId?: string;
  timestamp: string;
  source: "ai-context" | "spec-rag-mcp";
  origin?: string;
  feature: string;
  version?: string | null;
  intent?: "implement" | "test" | "review" | "drift";
  mode: "summary" | "full" | "chunked";
  status?: "generated" | "cached" | "warning";
  durationMs?: number;
  chunkCount?: number;
  estimatedTokens?: number;
  budgetLimit?: number;
  budgetExceeded?: boolean;
  cacheKey?: string | null;
  sessionId?: string | null;
  relatedSpecs?: string[];
  servedBlocks?: string[];
};

type RagFeedback = {
  invocationId: string;
  feature?: string;
  timestamp: string;
  rating: "up" | "down";
  issues?: string[];
  comment?: string;
};

const TELEMETRY_FILE = path.resolve(".telemetry", "context-usage.jsonl");
const FEEDBACK_FILE = path.resolve(".telemetry", "rag-feedback.jsonl");

if (!fs.existsSync(TELEMETRY_FILE)) {
  console.log("No context telemetry recorded yet.");
  process.exit(0);
}

const events = fs
  .readFileSync(TELEMETRY_FILE, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line) as ContextTelemetryEvent);

if (events.length === 0) {
  console.log("No context telemetry recorded yet.");
  process.exit(0);
}

const totalTokens = events.reduce((sum, event) => sum + (event.estimatedTokens ?? 0), 0);
const totalChunks = events.reduce((sum, event) => sum + (event.chunkCount ?? 0), 0);
const totalDuration = events.reduce((sum, event) => sum + (event.durationMs ?? 0), 0);
const cacheHits = events.filter((event) => event.status === "cached").length;
const warnings = events.filter((event) => event.budgetExceeded).length;

const byFeature = new Map<
  string,
  {
    calls: number;
    estimatedTokens: number;
    chunks: number;
    durationMs: number;
    cacheHits: number;
    warnings: number;
  }
>();
const byIntent = new Map<
  string,
  { calls: number; estimatedTokens: number; durationMs: number; cacheHits: number; warnings: number }
>();
const byMode = new Map<string, { calls: number; estimatedTokens: number; cacheHits: number }>();
const byBlock = new Map<string, { uses: number; estimatedTokens: number }>();

for (const event of events) {
  const featureStats = byFeature.get(event.feature) ?? {
    calls: 0,
    estimatedTokens: 0,
    chunks: 0,
    durationMs: 0,
    cacheHits: 0,
    warnings: 0,
  };
  featureStats.calls += 1;
  featureStats.estimatedTokens += event.estimatedTokens ?? 0;
  featureStats.chunks += event.chunkCount ?? 0;
  featureStats.durationMs += event.durationMs ?? 0;
  if (event.status === "cached") featureStats.cacheHits += 1;
  if (event.budgetExceeded) featureStats.warnings += 1;
  byFeature.set(event.feature, featureStats);

  const intentKey = event.intent ?? "unspecified";
  const intentStats = byIntent.get(intentKey) ?? {
    calls: 0,
    estimatedTokens: 0,
    durationMs: 0,
    cacheHits: 0,
    warnings: 0,
  };
  intentStats.calls += 1;
  intentStats.estimatedTokens += event.estimatedTokens ?? 0;
  intentStats.durationMs += event.durationMs ?? 0;
  if (event.status === "cached") intentStats.cacheHits += 1;
  if (event.budgetExceeded) intentStats.warnings += 1;
  byIntent.set(intentKey, intentStats);

  const modeStats = byMode.get(event.mode) ?? { calls: 0, estimatedTokens: 0, cacheHits: 0 };
  modeStats.calls += 1;
  modeStats.estimatedTokens += event.estimatedTokens ?? 0;
  if (event.status === "cached") modeStats.cacheHits += 1;
  byMode.set(event.mode, modeStats);

  for (const block of event.servedBlocks ?? []) {
    const blockStats = byBlock.get(block) ?? { uses: 0, estimatedTokens: 0 };
    blockStats.uses += 1;
    blockStats.estimatedTokens += event.estimatedTokens ?? 0;
    byBlock.set(block, blockStats);
  }
}

console.log(`Events: ${events.length}`);
console.log(`Estimated tokens: ${totalTokens}`);
console.log(`Chunks/documents served: ${totalChunks}`);
console.log(
  `Average duration: ${events.length > 0 ? (totalDuration / events.length).toFixed(2) : "0"}ms`,
);
console.log(`Cache hits: ${cacheHits}`);
console.log(`Budget warnings: ${warnings}`);

console.log("");
console.log("| Intent | Calls | Est. tokens | Avg tokens | Avg ms | Cache hits | Warnings |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const [intent, data] of [...byIntent.entries()].sort((left, right) =>
  left[0].localeCompare(right[0]),
)) {
  console.log(
    `| ${intent} | ${data.calls} | ${data.estimatedTokens} | ${(data.estimatedTokens / data.calls).toFixed(2)} | ${(data.durationMs / data.calls).toFixed(2)} | ${data.cacheHits} | ${data.warnings} |`,
  );
}

console.log("");
console.log("| Mode | Calls | Est. tokens | Avg tokens | Cache hits |");
console.log("| --- | ---: | ---: | ---: | ---: |");
for (const [mode, data] of [...byMode.entries()].sort((left, right) =>
  left[0].localeCompare(right[0]),
)) {
  console.log(
    `| ${mode} | ${data.calls} | ${data.estimatedTokens} | ${(data.estimatedTokens / data.calls).toFixed(2)} | ${data.cacheHits} |`,
  );
}

console.log("");
console.log("| Feature | Calls | Est. tokens | Avg tokens | Avg ms | Cache hits | Warnings |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const [feature, data] of [...byFeature.entries()].sort((left, right) =>
  left[0].localeCompare(right[0]),
)) {
  console.log(
    `| ${feature} | ${data.calls} | ${data.estimatedTokens} | ${(data.estimatedTokens / data.calls).toFixed(2)} | ${(data.durationMs / data.calls).toFixed(2)} | ${data.cacheHits} | ${data.warnings} |`,
  );
}

if (byBlock.size > 0) {
  console.log("");
  console.log("| Served block | Uses | Avg tokens/event |");
  console.log("| --- | ---: | ---: |");
  for (const [block, data] of [...byBlock.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    console.log(`| ${block} | ${data.uses} | ${(data.estimatedTokens / data.uses).toFixed(2)} |`);
  }
}

const bySession = new Map<
  string,
  { calls: number; features: Set<string>; estimatedTokens: number; durationMs: number }
>();

for (const event of events) {
  const sid = event.sessionId ?? "unknown";
  const current = bySession.get(sid) ?? {
    calls: 0,
    features: new Set<string>(),
    estimatedTokens: 0,
    durationMs: 0,
  };
  current.calls += 1;
  current.features.add(event.feature);
  current.estimatedTokens += event.estimatedTokens ?? 0;
  current.durationMs += event.durationMs ?? 0;
  bySession.set(sid, current);
}

console.log("");
console.log("| Session | Calls | Est. tokens | Total ms | Features |");
console.log("| --- | ---: | ---: | ---: | --- |");
for (const [sessionId, data] of [...bySession.entries()].sort(
  (left, right) => right[1].calls - left[1].calls,
)) {
  const shortId = sessionId.length > 8 ? `${sessionId.slice(0, 8)}...` : sessionId;
  console.log(
    `| ${shortId} | ${data.calls} | ${data.estimatedTokens} | ${data.durationMs} | ${[...data.features].join(", ")} |`,
  );
}

const feedbackRecords: RagFeedback[] = fs.existsSync(FEEDBACK_FILE)
  ? fs
      .readFileSync(FEEDBACK_FILE, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RagFeedback)
  : [];

if (feedbackRecords.length === 0) {
  console.log("\nNo RAG feedback recorded yet. Use: npm run rag:feedback");
  process.exit(0);
}

const ratedIds = new Set(feedbackRecords.map((feedback) => feedback.invocationId));
const ratedCount = events.filter((event) => event.invocationId && ratedIds.has(event.invocationId)).length;
const ups = feedbackRecords.filter((feedback) => feedback.rating === "up").length;
const downs = feedbackRecords.filter((feedback) => feedback.rating === "down").length;
const approvalRate = feedbackRecords.length > 0 ? ((ups / feedbackRecords.length) * 100).toFixed(1) : "-";

console.log(
  `\nRAG feedback: ${feedbackRecords.length} ratings (${ratedCount}/${events.length} invocations rated)`,
);
console.log(`Approvals: ${ups} up  Rejections: ${downs} down  Rate: ${approvalRate}%`);

const issueCounts = new Map<string, number>();
for (const feedback of feedbackRecords) {
  for (const issue of feedback.issues ?? []) {
    issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
  }
}

if (issueCounts.size > 0) {
  console.log("");
  console.log("| Feedback issue | Count |");
  console.log("| --- | ---: |");
  for (const [issue, count] of [...issueCounts.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    console.log(`| ${issue} | ${count} |`);
  }
}
