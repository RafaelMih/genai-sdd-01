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
};

type RagFeedback = {
  invocationId: string;
  feature?: string;
  timestamp: string;
  rating: "up" | "down";
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
    summaryCalls: number;
    fullCalls: number;
    durationMs: number;
    cacheHits: number;
    warnings: number;
  }
>();

for (const event of events) {
  const current = byFeature.get(event.feature) ?? {
    calls: 0,
    estimatedTokens: 0,
    chunks: 0,
    summaryCalls: 0,
    fullCalls: 0,
    durationMs: 0,
    cacheHits: 0,
    warnings: 0,
  };

  current.calls += 1;
  current.estimatedTokens += event.estimatedTokens ?? 0;
  current.chunks += event.chunkCount ?? 0;
  current.durationMs += event.durationMs ?? 0;
  if (event.status === "cached") current.cacheHits += 1;
  if (event.budgetExceeded) current.warnings += 1;
  if (event.mode === "full") current.fullCalls += 1;
  if (event.mode === "summary" || event.mode === "chunked") current.summaryCalls += 1;

  byFeature.set(event.feature, current);
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
console.log(
  "| Feature | Calls | Est. tokens | Chunks/docs | Avg ms | Cache hits | Warnings | Summary/chunked | Full |",
);
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");

for (const [feature, data] of [...byFeature.entries()].sort((left, right) =>
  left[0].localeCompare(right[0]),
)) {
  console.log(
    `| ${feature} | ${data.calls} | ${data.estimatedTokens} | ${data.chunks} | ${(data.durationMs / data.calls).toFixed(2)} | ${data.cacheHits} | ${data.warnings} | ${data.summaryCalls} | ${data.fullCalls} |`,
  );
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
  const shortId = sessionId.length > 8 ? `${sessionId.slice(0, 8)}…` : sessionId;
  console.log(
    `| ${shortId} | ${data.calls} | ${data.estimatedTokens} | ${data.durationMs} | ${[...data.features].join(", ")} |`,
  );
}

// Feedback do RAG
const feedbackRecords: RagFeedback[] = fs.existsSync(FEEDBACK_FILE)
  ? fs
      .readFileSync(FEEDBACK_FILE, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RagFeedback)
  : [];

if (feedbackRecords.length === 0) {
  console.log("\nNenhum feedback de RAG registrado ainda. Use: npm run rag:feedback");
} else {
  const ratedIds = new Set(feedbackRecords.map((f) => f.invocationId));
  const ratedCount = events.filter((e) => e.invocationId && ratedIds.has(e.invocationId)).length;
  const ups = feedbackRecords.filter((f) => f.rating === "up").length;
  const downs = feedbackRecords.filter((f) => f.rating === "down").length;
  const approvalRate = feedbackRecords.length > 0 ? ((ups / feedbackRecords.length) * 100).toFixed(1) : "–";

  console.log(`\nRAG Feedback: ${feedbackRecords.length} avaliações (${ratedCount}/${events.length} invocações avaliadas)`);
  console.log(`Aprovações: ${ups} ↑  Rejeições: ${downs} ↓  Taxa: ${approvalRate}%`);

  const byFeatureFeedback = new Map<string, { ups: number; downs: number }>();
  for (const fb of feedbackRecords) {
    const feature = fb.feature ?? "unknown";
    const current = byFeatureFeedback.get(feature) ?? { ups: 0, downs: 0 };
    if (fb.rating === "up") current.ups += 1;
    else current.downs += 1;
    byFeatureFeedback.set(feature, current);
  }

  if (byFeatureFeedback.size > 0) {
    console.log("");
    console.log("| Feature | ↑ Up | ↓ Down | Taxa aprovação |");
    console.log("| --- | ---: | ---: | ---: |");
    for (const [feat, data] of [...byFeatureFeedback.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const total = data.ups + data.downs;
      const rate = total > 0 ? `${((data.ups / total) * 100).toFixed(1)}%` : "–";
      console.log(`| ${feat} | ${data.ups} | ${data.downs} | ${rate} |`);
    }
  }

  const comments = feedbackRecords.filter((f) => f.comment);
  if (comments.length > 0) {
    console.log("\nComentários recentes:");
    for (const fb of comments.slice(-5)) {
      console.log(`  [${fb.rating}] ${fb.invocationId.slice(0, 8)}… — "${fb.comment}"`);
    }
  }
}
