#!/usr/bin/env node
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
const FEATURES_ROOT = path.resolve("specs", "features");
function isSeparatorRow(line) {
  return /^\|\s*[-: ]+\s*(\|\s*[-: ]+\s*)+\|$/.test(line.trim());
}
function parseTableRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}
async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}
async function generateSummary(feature) {
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
  const colWidth = [
    Math.max(...[headerRow[0], ...dataRows.map((r) => r[0])].map((s) => s.length), 4),
    Math.max(...[headerRow[1], ...dataRows.map((r) => r[1])].map((s) => s.length), 4),
    Math.max(...[headerRow[2], ...dataRows.map((r) => r[2])].map((s) => s.length), 4),
  ];
  const pad = (s, n) => s.padEnd(n);
  const header = `| ${pad(headerRow[0], colWidth[0])} | ${pad(headerRow[1], colWidth[1])} | ${pad(headerRow[2], colWidth[2])} |`;
  const separator = `| ${"-".repeat(colWidth[0])} | ${"-".repeat(colWidth[1])} | ${"-".repeat(colWidth[2])} |`;
  const rows = dataRows
    .map(
      (row) =>
        `| ${pad(row[0], colWidth[0])} | ${pad(row[1], colWidth[1])} | ${pad(row[2], colWidth[2])} |`,
    )
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
async function main() {
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
