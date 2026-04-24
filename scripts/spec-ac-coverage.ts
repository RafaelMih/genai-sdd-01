#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

type SpecInfo = {
  feature: string;
  file: string;
  version: [number, number, number];
};

const FEATURES_SPEC_ROOT = path.resolve("specs", "features");
const FEATURES_SRC_ROOT = path.resolve("src", "features");

function parseVersion(fileName: string): [number, number, number] | null {
  const match = fileName.match(/spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: [number, number, number], right: [number, number, number]): number {
  if (left[0] !== right[0]) return left[0] - right[0];
  if (left[1] !== right[1]) return left[1] - right[1];
  return left[2] - right[2];
}

function getLatestFeatureSpecs(): SpecInfo[] {
  if (!fs.existsSync(FEATURES_SPEC_ROOT)) return [];

  const specs: SpecInfo[] = [];

  for (const feature of fs.readdirSync(FEATURES_SPEC_ROOT, { withFileTypes: true })) {
    if (!feature.isDirectory()) continue;

    for (const file of fs.readdirSync(path.join(FEATURES_SPEC_ROOT, feature.name))) {
      const version = parseVersion(file);
      if (!version) continue;

      specs.push({
        feature: feature.name,
        file: path.join(FEATURES_SPEC_ROOT, feature.name, file),
        version,
      });
    }
  }

  const latestByFeature = new Map<string, SpecInfo>();

  for (const spec of specs) {
    const current = latestByFeature.get(spec.feature);

    if (!current || compareVersions(spec.version, current.version) > 0) {
      latestByFeature.set(spec.feature, spec);
    }
  }

  return [...latestByFeature.values()].sort((left, right) =>
    left.feature.localeCompare(right.feature),
  );
}

function extractAcceptanceCriteria(specText: string): string[] {
  const ids = new Set<string>();

  for (const match of specText.matchAll(/\bAC-?\d+\b/gi)) {
    ids.add(match[0].replace("-", "").toUpperCase());
  }

  return [...ids];
}

function getFeatureTestFiles(feature: string): string[] {
  const featureRoot = path.join(FEATURES_SRC_ROOT, feature);

  if (!fs.existsSync(featureRoot)) return [];

  const out: string[] = [];
  const stack = [featureRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (/\.test\.(ts|tsx)$/i.test(entry.name)) {
        out.push(fullPath);
      }
    }
  }

  return out;
}

let hasErrors = false;

for (const spec of getLatestFeatureSpecs()) {
  const specText = fs.readFileSync(spec.file, "utf8");
  const acceptanceCriteria = extractAcceptanceCriteria(specText);
  const traceabilityPath = path.join(FEATURES_SPEC_ROOT, spec.feature, "TRACEABILITY.md");

  if (acceptanceCriteria.length === 0) continue;

  if (!fs.existsSync(traceabilityPath)) {
    console.error(`[spec:coverage] Missing TRACEABILITY.md for feature "${spec.feature}"`);
    hasErrors = true;
    continue;
  }

  const traceabilityText = fs.readFileSync(traceabilityPath, "utf8").toUpperCase();

  for (const ac of acceptanceCriteria) {
    if (!traceabilityText.includes(ac)) {
      console.error(`[spec:coverage] ${spec.feature}: ${ac} is missing from TRACEABILITY.md`);
      hasErrors = true;
    }
  }

  const testFiles = getFeatureTestFiles(spec.feature);

  if (testFiles.length === 0) continue;

  const testCorpus = testFiles
    .map((file) => fs.readFileSync(file, "utf8").toUpperCase())
    .join("\n");

  for (const ac of acceptanceCriteria) {
    if (!testCorpus.includes(ac)) {
      console.error(`[spec:coverage] ${spec.feature}: ${ac} is not referenced by local test files`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log("spec:coverage passed");
