#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type VersionTuple = [number, number, number];

const FEATURES_ROOT = path.resolve("specs", "features");

function compareVersions(left: VersionTuple, right: VersionTuple): number {
  if (left[0] !== right[0]) return left[0] - right[0];
  if (left[1] !== right[1]) return left[1] - right[1];
  return left[2] - right[2];
}

function parseVersion(fileName: string): VersionTuple | null {
  const match = fileName.match(/^spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function getSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = normalizeWhitespace(markdown).split("\n");

  let current = "__root__";
  let buffer: string[] = [];

  function flush() {
    const content = buffer.join("\n").trim();
    if (content) sections.set(current, content);
    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);

    if (headingMatch) {
      flush();
      current = headingMatch[1].trim();
      continue;
    }

    if (/^#\s+/.test(line)) continue;

    buffer.push(line);
  }

  flush();

  return sections;
}

function buildContextMarkdown(feature: string, specFileName: string, sections: Map<string, string>): string {
  const preferredOrder = [
    "Objective",
    "Scope",
    "Out of scope",
    "User flow",
    "Acceptance criteria",
    "Dependencies",
    "Tests",
  ];

  const summarySections = preferredOrder
    .filter((heading) => sections.has(heading))
    .map((heading) => `## ${heading}\n\n${sections.get(heading)?.trim() ?? ""}`);

  return `# Context - ${feature}

Spec: specs/features/${feature}/${specFileName}

This file is the canonical short context for AI-assisted work on this feature.
It summarizes only the current active spec and should stay aligned with the latest approved version.

${summarySections.join("\n\n")}
`;
}

async function findLatestSpec(featureDir: string): Promise<{ fileName: string; version: VersionTuple } | null> {
  const entries = await readdir(featureDir, { withFileTypes: true });
  const candidates: Array<{ fileName: string; version: VersionTuple }> = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const version = parseVersion(entry.name);
    if (!version) continue;
    candidates.push({ fileName: entry.name, version });
  }

  if (candidates.length === 0) return null;

  candidates.sort((left, right) => compareVersions(left.version, right.version));
  return candidates[candidates.length - 1];
}

async function main(): Promise<void> {
  const entries = await readdir(FEATURES_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const feature = entry.name;
    const featureDir = path.join(FEATURES_ROOT, feature);
    const latestSpec = await findLatestSpec(featureDir);
    if (!latestSpec) continue;

    const specPath = path.join(featureDir, latestSpec.fileName);
    const specContent = await readFile(specPath, "utf8");
    const sections = getSections(specContent);
    const contextContent = buildContextMarkdown(feature, latestSpec.fileName, sections);

    await mkdir(featureDir, { recursive: true });
    await writeFile(path.join(featureDir, "CONTEXT.md"), contextContent, "utf8");
  }

  console.log("Feature contexts generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
