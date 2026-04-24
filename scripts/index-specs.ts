#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SpecType = "product" | "technical" | "decision" | "feature";

type SpecManifestEntry = {
  id: string;
  path: string;
  type: SpecType;
  feature?: string;
  version?: string;
  status?: "active" | "superseded" | "archived";
  dependsOn?: string[];
};

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

const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");
const OUTPUT_PATH = path.resolve("specs", ".index", "spec-chunks.json");

// ✅ Corrigido aqui
function slugify(value: string | number): string {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3);
}

async function loadManifest(): Promise<SpecManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as SpecManifestEntry[];
}

async function readSpec(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), "utf8");
}

// -------------------- SPLIT --------------------

function splitByHeadings(markdown: string) {
  const lines = markdown.split(/\r?\n/);

  const sections: Array<{
    heading: string;
    section: string;
    content: string;
  }> = [];

  let currentHeading = "# Document";
  let currentSection = "Document";
  let buffer: string[] = [];

  function flush() {
    const content = buffer.join("\n").trim();
    if (!content) return;

    sections.push({
      heading: currentHeading,
      section: currentSection,
      content,
    });

    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      flush();
      currentHeading = line.trim();
      currentSection = headingMatch[2].trim();
      continue;
    }

    buffer.push(line);
  }

  flush();

  return sections;
}

function splitAcceptanceCriteria(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const chunks: string[] = [];

  let buffer: string[] = [];

  function isAcLine(line: string) {
    return /^[-*]?\s*AC\d+\s*[:.-]/i.test(line.trim());
  }

  function flush() {
    const text = buffer.join("\n").trim();
    if (text) chunks.push(text);
    buffer = [];
  }

  for (const line of lines) {
    if (isAcLine(line)) {
      flush();
    }
    buffer.push(line);
  }

  flush();

  return chunks.length > 0 ? chunks : [content.trim()].filter(Boolean);
}

function splitTests(content: string): string[] {
  const blocks = content
    .split(/\n(?=\s*-\s*(unit|integration|e2e)\s*:)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [content.trim()].filter(Boolean);
}

// -------------------- CHUNK --------------------

function chunkSection(
  entry: SpecManifestEntry,
  section: {
    heading: string;
    section: string;
    content: string;
  },
): SpecChunk[] {
  const sectionSlug = slugify(section.section);

  let parts: string[];

  if (/acceptance criteria/i.test(section.section)) {
    parts = splitAcceptanceCriteria(section.content);
  } else if (/tests?/i.test(section.section)) {
    parts = splitTests(section.content);
  } else {
    parts = [section.content.trim()].filter(Boolean);
  }

  return parts.map((content, index) => {
    const chunkId = [entry.id, entry.version ?? "no-version", sectionSlug, index + 1]
      .map(slugify)
      .join(":");

    return {
      id: chunkId,
      specId: entry.id,
      path: entry.path,
      type: entry.type,
      feature: entry.feature,
      version: entry.version,
      section: section.section,
      heading: section.heading,
      content,
      tokens: estimateTokens(content),
    };
  });
}

// -------------------- MAIN --------------------

async function main() {
  const manifest = (await loadManifest()).filter((entry) => entry.status !== "archived");

  const chunks: SpecChunk[] = [];

  for (const entry of manifest) {
    const markdown = await readSpec(entry.path);
    const sections = splitByHeadings(markdown);

    for (const section of sections) {
      chunks.push(...chunkSection(entry, section));
    }
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(chunks, null, 2), "utf8");

  console.log(`Indexed ${chunks.length} chunks`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
