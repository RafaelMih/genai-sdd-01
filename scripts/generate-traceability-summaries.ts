#!/usr/bin/env node

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const FEATURES_ROOT = path.resolve("specs", "features");

function isSeparatorRow(line: string): boolean {
  return /^\|\s*[-: ]+\s*(\|\s*[-: ]+\s*)+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function generateSummary(feature: string): Promise<void> {
  const traceabilityPath = path.join(FEATURES_ROOT, feature, "TRACEABILITY.md");
  const summaryPath = path.join(FEATURES_ROOT, feature, "TRACEABILITY-SUMMARY.md");

  if (!(await pathExists(traceabilityPath))) return;

  const content = await readFile(traceabilityPath, "utf8");
  const lines = content.split(/\r?\n/);

  const specLine = lines.find((line) => line.startsWith("Spec:")) ?? "";
  const tableLines = lines.filter((line) => line.trim().startsWith("|"));

  if (tableLines.length === 0) return;

  const headerRow = parseTableRow(tableLines[0]);
  const dataRows = tableLines
    .slice(1)
    .filter((line) => !isSeparatorRow(line))
    .map(parseTableRow)
    .filter((row) => row.length >= 3);

  const summaryHeader = [headerRow[0] ?? "AC", headerRow[2] ?? "Modulo(s)"];
  const summaryRows = dataRows.map((row) => [row[0] ?? "", row[2] ?? ""]);

  const colWidth = [
    Math.max(...[summaryHeader[0], ...summaryRows.map((row) => row[0])].map((s) => s.length), 4),
    Math.max(...[summaryHeader[1], ...summaryRows.map((row) => row[1])].map((s) => s.length), 6),
  ];

  const pad = (s: string, n: number) => s.padEnd(n);
  const header = `| ${pad(summaryHeader[0], colWidth[0])} | ${pad(summaryHeader[1], colWidth[1])} |`;
  const separator = `| ${"-".repeat(colWidth[0])} | ${"-".repeat(colWidth[1])} |`;
  const rows = summaryRows
    .map((row) => `| ${pad(row[0], colWidth[0])} | ${pad(row[1], colWidth[1])} |`)
    .join("\n");

  const featureTitle = feature
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const output = [
    `# Traceability Summary - ${featureTitle}`,
    "",
    specLine,
    "",
    "## Acceptance Criteria Mapping",
    "",
    header,
    separator,
    rows,
    "",
  ].join("\n");

  await writeFile(summaryPath, output, "utf8");
  console.log(`Generated TRACEABILITY-SUMMARY.md for ${feature}`);
}

async function main(): Promise<void> {
  const entries = await readdir(FEATURES_ROOT);
  for (const entry of entries) {
    await generateSummary(entry);
  }
  console.log("Traceability summaries generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
