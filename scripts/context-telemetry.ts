import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type ContextTelemetryEvent = {
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

const TELEMETRY_DIR = path.resolve(".telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "context-usage.jsonl");
const SESSION_FILE = path.join(TELEMETRY_DIR, ".session");
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

async function resolveSessionId(): Promise<string> {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;

  try {
    const raw = await readFile(SESSION_FILE, "utf8");
    const parsed = JSON.parse(raw) as { id: string; updatedAt: string };
    const age = Date.now() - new Date(parsed.updatedAt).getTime();

    if (age < SESSION_TTL_MS) {
      await writeFile(
        SESSION_FILE,
        JSON.stringify({ id: parsed.id, updatedAt: new Date().toISOString() }),
        "utf8",
      );
      return parsed.id;
    }
  } catch {
    // arquivo ausente ou corrompido — gera nova sessão
  }

  const id = randomUUID();
  await mkdir(TELEMETRY_DIR, { recursive: true });
  await writeFile(
    SESSION_FILE,
    JSON.stringify({ id, updatedAt: new Date().toISOString() }),
    "utf8",
  );
  return id;
}

export async function recordContextTelemetry(event: ContextTelemetryEvent): Promise<void> {
  await mkdir(TELEMETRY_DIR, { recursive: true });
  const sessionId = event.sessionId ?? (await resolveSessionId());
  await appendFile(
    TELEMETRY_FILE,
    `${JSON.stringify({
      invocationId: event.invocationId ?? randomUUID(),
      sessionId,
      status: event.status ?? "generated",
      origin: event.origin ?? event.source,
      ...event,
    })}\n`,
    "utf8",
  );
}
