#!/usr/bin/env node

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type RagFeedback = {
  invocationId: string;
  feature?: string;
  timestamp: string;
  rating: "up" | "down";
  issues?: Array<"too-large" | "missing-contract" | "missing-test" | "redundant-traceability">;
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
const VALID_ISSUES = new Set([
  "too-large",
  "missing-contract",
  "missing-test",
  "redundant-traceability",
]);

const [idOrFeature, rawRating, ...restArgs] = process.argv.slice(2);

if (!idOrFeature || !rawRating) {
  console.error(`
Usage:
  npm run rag:feedback -- <invocation-id | feature> <up|down> [issue-tags] [comment]

Issue tags:
  too-large
  missing-contract
  missing-test
  redundant-traceability

Examples:
  npm run rag:feedback -- abc-123 up
  npm run rag:feedback -- auth down too-large "contexto veio grande demais"
  npm run rag:feedback -- pokemon-list up missing-test,missing-contract
`);
  process.exit(1);
}

if (rawRating !== "up" && rawRating !== "down") {
  console.error(`Invalid rating: "${rawRating}". Use "up" or "down".`);
  process.exit(1);
}

const rating = rawRating as "up" | "down";

const issueArg =
  restArgs[0] && restArgs[0].split(",").every((item) => VALID_ISSUES.has(item.trim()))
    ? restArgs.shift()
    : undefined;
const issues = issueArg
  ? issueArg
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is RagFeedback["issues"][number] => VALID_ISSUES.has(item))
  : undefined;
const comment = restArgs.join(" ") || undefined;

async function resolveInvocationId(
  input: string,
): Promise<{ invocationId: string; feature?: string }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(input)) {
    return { invocationId: input };
  }

  let raw: string;
  try {
    raw = await readFile(TELEMETRY_FILE, "utf8");
  } catch {
    console.error("No telemetry event found. Run ai:context first.");
    process.exit(1);
  }

  const events = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TelemetryEvent)
    .filter((event) => event.feature === input && event.invocationId)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

  if (events.length === 0) {
    console.error(`No event found for feature "${input}".`);
    process.exit(1);
  }

  const latest = events[0];
  console.log(`Resolved invocationId: ${latest.invocationId} (${latest.timestamp})`);
  return { invocationId: latest.invocationId!, feature: input };
}

const { invocationId, feature } = await resolveInvocationId(idOrFeature);

const record: RagFeedback = {
  invocationId,
  feature,
  timestamp: new Date().toISOString(),
  rating,
  ...(issues && issues.length > 0 ? { issues } : {}),
  ...(comment ? { comment } : {}),
};

await mkdir(TELEMETRY_DIR, { recursive: true });
await appendFile(FEEDBACK_FILE, `${JSON.stringify(record)}\n`, "utf8");

const issueLabel = issues && issues.length > 0 ? ` [${issues.join(", ")}]` : "";
console.log(
  `Feedback recorded: ${rating}${issueLabel} for ${invocationId}${comment ? ` - "${comment}"` : ""}`,
);
