#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
const FEATURES_SRC_ROOT = path.resolve("src", "features");
const FEATURES_SPEC_ROOT = path.resolve("specs", "features");
async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}
async function main() {
  if (!(await exists(FEATURES_SRC_ROOT))) {
    console.log("No src/features directory found. Skipping trace validation.");
    return;
  }
  const features = await readdir(FEATURES_SRC_ROOT, { withFileTypes: true });
  let hasErrors = false;
  for (const entry of features) {
    if (!entry.isDirectory()) continue;
    const featureName = entry.name;
    const traceabilityPath = path.join(FEATURES_SRC_ROOT, featureName, "TRACEABILITY.md");
    const specDir = path.join(FEATURES_SPEC_ROOT, featureName);
    if (!(await exists(traceabilityPath))) {
      console.error(`[spec:trace] Missing TRACEABILITY.md for feature "${featureName}"`);
      hasErrors = true;
      continue;
    }
    if (!(await exists(specDir))) {
      console.error(`[spec:trace] Missing specs directory for feature "${featureName}"`);
      hasErrors = true;
      continue;
    }
    const traceabilityText = await readFile(traceabilityPath, "utf8");
    if (!/^# Traceability/m.test(traceabilityText)) {
      console.error(`[spec:trace] Invalid TRACEABILITY header for feature "${featureName}"`);
      hasErrors = true;
    }
    if (!/## Acceptance Criteria Mapping/m.test(traceabilityText)) {
      console.error(
        `[spec:trace] Missing "Acceptance Criteria Mapping" section in "${traceabilityPath}"`,
      );
      hasErrors = true;
    }
    const specReferenceMatch = traceabilityText.match(
      /Spec:\s+(specs\/features\/.+spec-v\d+\.\d+\.\d+\.md)/,
    );
    if (!specReferenceMatch) {
      console.error(`[spec:trace] Missing spec reference in "${traceabilityPath}"`);
      hasErrors = true;
    } else {
      const normalized = path.resolve(specReferenceMatch[1]);
      if (!(await exists(normalized))) {
        console.error(`[spec:trace] Referenced spec does not exist: ${specReferenceMatch[1]}`);
        hasErrors = true;
      }
    }
    const mappingLines = traceabilityText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- AC-"));
    if (mappingLines.length === 0) {
      console.error(`[spec:trace] No AC mappings found in "${traceabilityPath}"`);
      hasErrors = true;
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
  console.log("spec:trace passed");
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
