#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const FEATURES_SPEC_ROOT = path.resolve("specs", "features");
const ROUTES_DIR = path.resolve("src", "routes");

function parseVersion(fileName: string): [number, number, number] | null {
  const match = fileName.match(/spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function getLatestFeatureSpecs(): Array<{ feature: string; file: string }> {
  if (!fs.existsSync(FEATURES_SPEC_ROOT)) return [];

  const latestByFeature = new Map<string, { file: string; version: [number, number, number] }>();

  for (const featureEntry of fs.readdirSync(FEATURES_SPEC_ROOT, { withFileTypes: true })) {
    if (!featureEntry.isDirectory()) continue;

    for (const fileName of fs.readdirSync(path.join(FEATURES_SPEC_ROOT, featureEntry.name))) {
      const version = parseVersion(fileName);
      if (!version) continue;

      const current = latestByFeature.get(featureEntry.name);
      if (!current || compareVersions(version, current.version) > 0) {
        latestByFeature.set(featureEntry.name, {
          file: path.join(FEATURES_SPEC_ROOT, featureEntry.name, fileName),
          version,
        });
      }
    }
  }

  return [...latestByFeature.entries()].map(([feature, { file }]) => ({ feature, file }));
}

// Extrai rotas mencionadas em texto de spec (backticks, aspas JS e células de tabela Markdown)
function extractSpecRoutes(specText: string): Set<string> {
  const routes = new Set<string>();
  const ROUTE_RE = /[a-z][a-z0-9-]*/;

  const patterns: RegExp[] = [
    /`(\/[a-z][a-z0-9\-_/]*)`/gi,
    /'(\/[a-z][a-z0-9\-_/]*)'/g,
    /"(\/[a-z][a-z0-9\-_/]*)"/g,
    /\|\s*(\/[a-z][a-z0-9\-_/]*)\s*(?:\||$)/gm,
  ];

  for (const pattern of patterns) {
    for (const match of specText.matchAll(pattern)) {
      const route = match[1].trim();
      if (ROUTE_RE.test(route.slice(1))) {
        routes.add(route);
      }
    }
  }

  return routes;
}

// Extrai rotas registradas no código React Router (path="...")
function extractCodeRoutes(): Set<string> {
  const routes = new Set<string>();

  if (!fs.existsSync(ROUTES_DIR)) return routes;

  for (const fileName of fs.readdirSync(ROUTES_DIR)) {
    if (!/\.(tsx|ts|jsx|js)$/.test(fileName)) continue;

    const content = fs.readFileSync(path.join(ROUTES_DIR, fileName), "utf8");

    for (const match of content.matchAll(/path=["'](\/[^"']+)["']/g)) {
      routes.add(match[1]);
    }
  }

  return routes;
}

if (!fs.existsSync(ROUTES_DIR)) {
  console.log("spec:drift-ui skipped (src/routes not found)");
  process.exit(0);
}

const codeRoutes = extractCodeRoutes();
const specFiles = getLatestFeatureSpecs();

const allSpecRoutes = new Set<string>();
const routeToFeatures = new Map<string, string[]>();

for (const { feature, file } of specFiles) {
  const text = fs.readFileSync(file, "utf8");
  const specRoutes = extractSpecRoutes(text);

  for (const route of specRoutes) {
    allSpecRoutes.add(route);
    const features = routeToFeatures.get(route) ?? [];
    features.push(feature);
    routeToFeatures.set(route, features);
  }
}

let hasErrors = false;
let hasWarnings = false;

// Rotas mencionadas nas specs mas ausentes no código → BLOCKER
for (const route of allSpecRoutes) {
  if (!codeRoutes.has(route)) {
    const features = routeToFeatures.get(route)?.join(", ") ?? "?";
    console.error(
      `[spec:drift-ui] Rota "${route}" declarada nos specs (${features}) não está registrada em src/routes/`,
    );
    hasErrors = true;
  }
}

// Rotas no código sem menção em nenhum spec → WARN
for (const route of codeRoutes) {
  if (!allSpecRoutes.has(route)) {
    console.warn(
      `[spec:drift-ui] Rota "${route}" registrada em src/routes/ não está mencionada em nenhum spec`,
    );
    hasWarnings = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

if (hasWarnings) {
  console.log("spec:drift-ui passed with warnings");
} else {
  console.log("spec:drift-ui passed");
}
