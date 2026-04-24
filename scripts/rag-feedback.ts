#!/usr/bin/env node

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type RagFeedback = {
  invocationId: string;
  feature?: string;
  timestamp: string;
  rating: "up" | "down";
  comment?: string;
};

type TelemetryEvent = {
  invocationId?: string;
  feature: string;
  timestamp: string;
};

const TELEMETRY_DIR = path.resolve(".telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "context-usage.jsonl");
const FEEDBACK_FILE = path.join(TELEMETRY_DIR, "rag-feedback.jsonl");

const [idOrFeature, rawRating, ...commentParts] = process.argv.slice(2);

if (!idOrFeature || !rawRating) {
  console.error(`
Uso:
  npm run rag:feedback -- <invocation-id | feature> <up|down> [comentário]

Exemplos:
  npm run rag:feedback -- abc-123 up
  npm run rag:feedback -- auth down "chunks de objetivo foram redundantes"
  npm run rag:feedback -- pokemon-list up
`);
  process.exit(1);
}

if (rawRating !== "up" && rawRating !== "down") {
  console.error(`Rating inválido: "${rawRating}". Use "up" ou "down".`);
  process.exit(1);
}

const rating = rawRating as "up" | "down";
const comment = commentParts.join(" ") || undefined;

// Tenta resolver o idOrFeature como feature → busca o invocationId mais recente
async function resolveInvocationId(input: string): Promise<{ invocationId: string; feature?: string }> {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (UUID_RE.test(input)) {
    return { invocationId: input };
  }

  // Trata como nome de feature → busca o invocationId mais recente nos eventos
  let raw: string;
  try {
    raw = await readFile(TELEMETRY_FILE, "utf8");
  } catch {
    console.error("Nenhum evento de telemetria encontrado. Rode ai:context antes de avaliar.");
    process.exit(1);
  }

  const events = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TelemetryEvent)
    .filter((e) => e.feature === input && e.invocationId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (events.length === 0) {
    console.error(`Nenhum evento encontrado para feature "${input}".`);
    process.exit(1);
  }

  const latest = events[0];
  console.log(`Resolvido para invocationId: ${latest.invocationId} (${latest.timestamp})`);
  return { invocationId: latest.invocationId!, feature: input };
}

const { invocationId, feature } = await resolveInvocationId(idOrFeature);

const record: RagFeedback = {
  invocationId,
  feature,
  timestamp: new Date().toISOString(),
  rating,
  ...(comment ? { comment } : {}),
};

await mkdir(TELEMETRY_DIR, { recursive: true });
await appendFile(FEEDBACK_FILE, `${JSON.stringify(record)}\n`, "utf8");

console.log(`Feedback registrado: ${rating} para ${invocationId}${comment ? ` — "${comment}"` : ""}`);
