#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const FEATURES_SPEC_ROOT = path.resolve("specs", "features");
const ROUTES_DIR = path.resolve("src", "routes");

// Normaliza segmentos dinâmicos (:id, :name, etc.) para comparação de padrão
function normalizeRoute(route: string): string {
  return route.replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, ":param");
}

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
    /`(\/[a-z][a-z0-9\-_/:]*)`/gi,
    /'(\/[a-z][a-z0-9\-_/:]*)'/g,
    /"(\/[a-z][a-z0-9\-_/:]*)"/g,
    /\|\s*(\/[a-z][a-z0-9\-_/:]*)\s*(?:\||$)/gm,
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

const SRC_DIR = path.resolve("src");

// Extrai rotas-alvo de navigate(route, { replace: true }) no código fonte
function extractCodeRedirects(): Set<string> {
  const targets = new Set<string>();

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
        continue;
      }
      if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      for (const match of content.matchAll(
        /navigate\(\s*["'](\/[^"']+)["']\s*,\s*\{[^}]*replace\s*:\s*true[^}]*\}/g,
      )) {
        targets.add(match[1]);
      }
    }
  }

  scanDir(SRC_DIR);
  return targets;
}

// Extrai rotas-alvo de navigate com replace declaradas nas specs
function extractSpecRedirects(specText: string): Set<string> {
  const targets = new Set<string>();

  // Padrão exato de código: navigate('/rota', { replace: true })
  const NAVIGATE_RE = new RegExp(
    `navigate\\(\\s*['"](\\/[^'"]+)['""]\\s*,\\s*\\{[^}]*replace\\s*:\\s*true[^}]*\\}`,
    "g",
  );
  for (const match of specText.matchAll(NAVIGATE_RE)) {
    targets.add(match[1]);
  }

  // Prosa com "replace": "redirects to `/rota`" ou "navigates to `/rota`" + "replace" próximo
  const PROSE_RE =
    /(?:redirect(?:s|ed)?|navigates?)\s+to\s+[`'"]?(\/[a-z][a-z0-9\-_/]*)[`'"]?/gi;
  for (const match of specText.matchAll(PROSE_RE)) {
    const route = match[1];
    const surroundStart = Math.max(0, match.index! - 120);
    const surroundEnd = Math.min(specText.length, match.index! + match[0].length + 120);
    const surrounding = specText.slice(surroundStart, surroundEnd);
    if (/replace/i.test(surrounding)) {
      targets.add(route);
    }
  }

  return targets;
}

// Extrai targets de navigate(route) sem { replace: true } — navegação programática sem replace
function extractCodeNavigationTargets(): Set<string> {
  const targets = new Set<string>();

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
        continue;
      }
      if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");

      // navigate('/route') sem segundo argumento
      for (const match of content.matchAll(/navigate\(\s*["'](\/[^"']+)["']\s*\)/g)) {
        targets.add(match[1]);
      }
      // navigate('/route', { options sem replace: true })
      for (const match of content.matchAll(
        /navigate\(\s*["'](\/[^"']+)["']\s*,\s*\{(?![^}]*replace\s*:\s*true)[^}]*\}/g,
      )) {
        targets.add(match[1]);
      }
    }
  }

  scanDir(SRC_DIR);
  return targets;
}

if (!fs.existsSync(ROUTES_DIR)) {
  console.log("spec:drift-ui skipped (src/routes not found)");
  process.exit(0);
}

const codeRoutes = extractCodeRoutes();
const codeRedirects = extractCodeRedirects();
const codeNavigationTargets = extractCodeNavigationTargets();
const specFiles = getLatestFeatureSpecs();

const allSpecRoutes = new Set<string>();
const routeToFeatures = new Map<string, string[]>();
const allSpecRedirects = new Set<string>();
const redirectToFeatures = new Map<string, string[]>();

for (const { feature, file } of specFiles) {
  const text = fs.readFileSync(file, "utf8");

  for (const route of extractSpecRoutes(text)) {
    allSpecRoutes.add(route);
    const list = routeToFeatures.get(route) ?? [];
    list.push(feature);
    routeToFeatures.set(route, list);
  }

  for (const target of extractSpecRedirects(text)) {
    allSpecRedirects.add(target);
    const list = redirectToFeatures.get(target) ?? [];
    list.push(feature);
    redirectToFeatures.set(target, list);
  }
}

let hasErrors = false;
let hasWarnings = false;

// Mapas normalizados para suportar rotas dinâmicas (ex: /pokemon/:id)
const codeRoutesNormalized = new Map<string, string>(); // normalized → original
for (const r of codeRoutes) codeRoutesNormalized.set(normalizeRoute(r), r);

const allSpecRoutesNormalized = new Map<string, string>(); // normalized → original
for (const r of allSpecRoutes) allSpecRoutesNormalized.set(normalizeRoute(r), r);

const allSpecRedirectsNormalized = new Map<string, string>();
for (const r of allSpecRedirects) allSpecRedirectsNormalized.set(normalizeRoute(r), r);

// Rotas mencionadas nas specs mas ausentes no código → BLOCKER
for (const [normSpec, specRoute] of allSpecRoutesNormalized) {
  if (!codeRoutesNormalized.has(normSpec)) {
    const features = routeToFeatures.get(specRoute)?.join(", ") ?? "?";
    console.error(
      `[spec:drift-ui] Rota "${specRoute}" declarada nos specs (${features}) não está registrada em src/routes/`,
    );
    hasErrors = true;
  }
}

// Rotas no código sem menção em nenhum spec → WARN
for (const [normCode, codeRoute] of codeRoutesNormalized) {
  if (!allSpecRoutesNormalized.has(normCode)) {
    console.warn(
      `[spec:drift-ui] Rota "${codeRoute}" registrada em src/routes/ não está mencionada em nenhum spec`,
    );
    hasWarnings = true;
  }
}

// Redirects com replace declarados nos specs mas ausentes no código → BLOCKER
for (const [normSpec, specTarget] of allSpecRedirectsNormalized) {
  const inCode = [...codeRedirects].some((r) => normalizeRoute(r) === normSpec);
  if (!inCode) {
    const features = redirectToFeatures.get(specTarget)?.join(", ") ?? "?";
    console.error(
      `[spec:drift-ui] Redirect com replace para "${specTarget}" declarado nos specs (${features}) não encontrado em navigate(..., { replace: true }) no código`,
    );
    hasErrors = true;
  }
}

// Redirects com replace no código sem cobertura em nenhum spec → WARN
for (const target of codeRedirects) {
  const normTarget = normalizeRoute(target);
  if (!allSpecRedirectsNormalized.has(normTarget)) {
    console.warn(
      `[spec:drift-ui] navigate("${target}", { replace: true }) no código não está declarado em nenhum spec`,
    );
    hasWarnings = true;
  }
}

// Navegações programáticas sem replace sem cobertura em spec → WARN
for (const target of codeNavigationTargets) {
  const normTarget = normalizeRoute(target);
  const inSpecRoutes = allSpecRoutesNormalized.has(normTarget);
  const inSpecRedirects = allSpecRedirectsNormalized.has(normTarget);
  if (!inSpecRoutes && !inSpecRedirects) {
    console.warn(
      `[spec:drift-ui] navigate("${target}") sem replace no código não possui cobertura de spec`,
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
