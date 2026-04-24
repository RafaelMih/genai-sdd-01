import { appendFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type ContextTelemetryEvent = {
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

const TELEMETRY_DIR = path.resolve(".telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "context-usage.jsonl");
const SESSION_ID = randomUUID();

export async function recordContextTelemetry(event: ContextTelemetryEvent): Promise<void> {
  await mkdir(TELEMETRY_DIR, { recursive: true });
  await appendFile(
    TELEMETRY_FILE,
    `${JSON.stringify({
      invocationId: event.invocationId ?? randomUUID(),
      sessionId: event.sessionId ?? SESSION_ID,
      status: event.status ?? "generated",
      origin: event.origin ?? event.source,
      ...event,
    })}\n`,
    "utf8",
  );
}
