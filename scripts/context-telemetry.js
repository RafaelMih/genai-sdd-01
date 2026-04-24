import { appendFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
const TELEMETRY_DIR = path.resolve(".telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "context-usage.jsonl");
const SESSION_ID = process.env.CLAUDE_SESSION_ID ?? randomUUID();
export async function recordContextTelemetry(event) {
    await mkdir(TELEMETRY_DIR, { recursive: true });
    await appendFile(TELEMETRY_FILE, `${JSON.stringify({
        invocationId: event.invocationId ?? randomUUID(),
        sessionId: event.sessionId ?? SESSION_ID,
        status: event.status ?? "generated",
        origin: event.origin ?? event.source,
        ...event,
    })}\n`, "utf8");
}
