#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

type SpecInfo = {
  feature: string;
  file: string;
  version: [number, number, number];
};

const FEATURES_SPEC_ROOT = path.resolve("specs", "features");

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

  return [...latestByFeature.values()];
}

function extractDependencyPath(specText: string): string | null {
  const match = specText.match(/specs\/technical\/firestore-schema-v\d+\.\d+\.\d+\.md/i);
  return match?.[0] ?? null;
}

function extractFirestoreContractFields(specText: string): string[] {
  const contractMatch = specText.match(
    /## Firestore write contract([\s\S]*?)(?:\n## |\r\n## |\n# |\r\n# |$)/i,
  );

  if (!contractMatch) return [];

  const ids = new Set<string>();

  for (const line of contractMatch[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (fieldMatch) {
      ids.add(fieldMatch[1].trim());
    }
  }

  return [...ids];
}

function extractUsersSchemaFields(schemaText: string): string[] {
  const usersSectionMatch = schemaText.match(
    /### users\/\{uid\}([\s\S]*?)(?:\n### |\r\n### |\n## |\r\n## |$)/i,
  );

  if (!usersSectionMatch) return [];

  const ids = new Set<string>();

  for (const line of usersSectionMatch[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^\s*-\s*([A-Za-z0-9_]+)\s*:/);
    if (fieldMatch) {
      ids.add(fieldMatch[1].trim());
    }
  }

  return [...ids];
}

let hasErrors = false;

for (const spec of getLatestFeatureSpecs()) {
  const specText = fs.readFileSync(spec.file, "utf8");
  const schemaDependency = extractDependencyPath(specText);

  if (!schemaDependency) continue;

  const featureFields = extractFirestoreContractFields(specText);
  if (featureFields.length === 0) continue;

  const schemaPath = path.resolve(schemaDependency);

  if (!fs.existsSync(schemaPath)) {
    console.error(`[spec:drift] ${spec.feature}: missing technical schema "${schemaDependency}"`);
    hasErrors = true;
    continue;
  }

  const schemaFields = extractUsersSchemaFields(fs.readFileSync(schemaPath, "utf8"));
  const missingFields = featureFields.filter((field) => !schemaFields.includes(field));

  if (missingFields.length > 0) {
    console.error(
      `[spec:drift] ${spec.feature}: Firestore write contract has fields missing from schema ${schemaDependency}: ${missingFields.join(", ")}`,
    );
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log("spec:drift passed");
