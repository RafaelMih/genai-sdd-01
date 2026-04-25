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

function extractAcceptanceCriteria(content: string): string[] {
  return normalizeWhitespace(content)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^- AC\d+:/i.test(line))
    .map((line) => line.replace(/^- /, ""))
    .map((line) => (line.length > 160 ? `${line.slice(0, 157)}...` : line));
}

function extractContractSections(sections: Map<string, string>): Array<{ heading: string; body: string }> {
  const headings = [...sections.keys()].filter((heading) => /contract/i.test(heading));

  return headings.slice(0, 4).map((heading) => ({
    heading,
    body: sections.get(heading)?.trim() ?? "",
  }));
}

function extractTargetFiles(traceabilitySummary: string | null): string[] {
  if (!traceabilitySummary) return [];

  const lines = normalizeWhitespace(traceabilitySummary)
    .split("\n")
    .filter((line) => line.trim().startsWith("|"));

  if (lines.length < 3) return [];

  const files = new Set<string>();

  for (const line of lines.slice(2)) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const moduleCell = cells[1];

    if (!moduleCell) continue;

    for (const rawFile of moduleCell.split("+")) {
      const cleaned = rawFile.replace(/`/g, "").trim();
      if (cleaned) files.add(cleaned);
    }
  }

  return [...files].slice(0, 8);
}

function buildList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildContextMarkdown(input: {
  feature: string;
  specFileName: string;
  sections: Map<string, string>;
  traceabilitySummary: string | null;
}): string {
  const objective = input.sections.get("Objective")?.trim() ?? "Nao definido.";
  const scope = input.sections.get("Scope")?.trim() ?? "Nao definido.";
  const acceptanceCriteria = extractAcceptanceCriteria(input.sections.get("Acceptance criteria") ?? "");
  const contracts = extractContractSections(input.sections);
  const targetFiles = extractTargetFiles(input.traceabilitySummary);

  const parts = [
    `# Context - ${input.feature}`,
    "",
    `Spec: specs/features/${input.feature}/${input.specFileName}`,
    "",
    "Contexto canonico curto para trabalho assistido por IA.",
    "Use este arquivo antes de qualquer retrieval expandido.",
    "",
    "## Objective",
    "",
    objective,
    "",
    "## Scope",
    "",
    scope,
    "",
    "## Active Acceptance Criteria",
    "",
    acceptanceCriteria.length > 0 ? buildList(acceptanceCriteria) : "- Nenhum AC encontrado.",
  ];

  if (contracts.length > 0) {
    parts.push("", "## Contracts", "");
    for (const contract of contracts) {
      const firstLine =
        contract.body
          .split("\n")
          .map((line) => line.trim())
          .find((line) => line.length > 0 && !line.startsWith("|")) ?? "See active spec.";
      parts.push(`- ${contract.heading}: ${firstLine}`);
    }
  }

  if (targetFiles.length > 0) {
    parts.push("", "## Target Files", "", buildList(targetFiles));
  }

  parts.push("");

  return parts.join("\n");
}

async function findLatestSpec(
  featureDir: string,
): Promise<{ fileName: string; version: VersionTuple } | null> {
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
    const traceabilitySummary = await readFile(
      path.join(featureDir, "TRACEABILITY-SUMMARY.md"),
      "utf8",
    ).catch(() => null);
    const contextContent = buildContextMarkdown({
      feature,
      specFileName: latestSpec.fileName,
      sections,
      traceabilitySummary,
    });

    await mkdir(featureDir, { recursive: true });
    await writeFile(path.join(featureDir, "CONTEXT.md"), contextContent, "utf8");
  }

  console.log("Feature contexts generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
