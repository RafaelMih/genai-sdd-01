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

const TELEMETRY_FILE = path.resolve(".telemetry", "context-usage.jsonl");

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
