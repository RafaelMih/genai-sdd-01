import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type ContextTelemetryEvent = {
  timestamp: string;
  source: "ai-context" | "spec-rag-mcp";
  feature: string;
  version?: string | null;
  mode: "summary" | "full" | "chunked";
  chunkCount?: number;
  estimatedTokens?: number;
  relatedSpecs?: string[];
};

const TELEMETRY_DIR = path.resolve(".telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "context-usage.jsonl");

export async function recordContextTelemetry(event: ContextTelemetryEvent): Promise<void> {
  await mkdir(TELEMETRY_DIR, { recursive: true });
  await appendFile(TELEMETRY_FILE, `${JSON.stringify(event)}\n`, "utf8");
}
