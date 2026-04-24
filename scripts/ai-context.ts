#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

type SpecType = "product" | "technical" | "decision" | "feature";

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

const CHUNKS_PATH = path.resolve("specs", ".index", "spec-chunks.json");

const feature = process.argv[2];
const version = process.argv[3];

if (!feature) {
  console.error(`
❌ Missing feature argument

Usage:
  npm run ai:context <feature> [version]

Examples:
  npm run ai:context auth
  npm run ai:context auth 1.0.0
`);

  process.exit(1);
}

async function loadChunks(): Promise<SpecChunk[]> {
  const raw = await readFile(CHUNKS_PATH, "utf8");
  return JSON.parse(raw) as SpecChunk[];
}

function scoreChunk(chunk: SpecChunk, feature: string, version?: string): number {
  let score = 0;

  if (chunk.feature === feature) score += 100;
  if (chunk.specId === feature) score += 80;

  if (version && chunk.version === version) score += 50;
  if (version && chunk.version !== version) score -= 100;

  if (chunk.type === "feature") score += 30;

  if (/objective/i.test(chunk.section)) score += 20;
  if (/scope/i.test(chunk.section)) score += 20;
  if (/acceptance criteria/i.test(chunk.section)) score += 40;
  if (/user flow/i.test(chunk.section)) score += 30;
  if (/tests?/i.test(chunk.section)) score += 20;

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

async function main() {
  const chunks = await loadChunks();

  const relevantChunks = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, feature, version),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((item) => item.chunk);

  if (relevantChunks.length === 0) {
    throw new Error(
      `No relevant spec chunks found for "${feature}"${
        version ? ` v${version}` : ""
      }. Run npm run index:specs or check your specs.`,
    );
  }

  const context = relevantChunks.map(formatChunk).join("\n\n---\n\n");

  console.log(`
You are implementing a Spec Driven Development task.

Use ONLY the following specs as source of truth.
If something is missing, stop and ask for spec clarification.
Do not invent routes, fields, validations, schemas, UI behavior, business rules, or tests.

Feature: ${feature}
Version: ${version ?? "latest/relevant"}

Relevant specs:

${context}
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
