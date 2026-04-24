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
    }
    catch {
        return false;
    }
}
function compareVersions(a, b) {
    if (a[0] !== b[0])
        return a[0] - b[0];
    if (a[1] !== b[1])
        return a[1] - b[1];
    return a[2] - b[2];
}
function parseVersionFromName(name) {
    const flat = name.match(/^spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
    if (flat)
        return [Number(flat[1]), Number(flat[2]), Number(flat[3])];
    const nested = name.match(/^v(\d+)\.(\d+)\.(\d+)$/i);
    if (nested)
        return [Number(nested[1]), Number(nested[2]), Number(nested[3])];
    return null;
}
async function findLatestSpecPath(featureSpecDir) {
    if (!(await exists(featureSpecDir)))
        return null;
    const entries = await readdir(featureSpecDir, { withFileTypes: true });
    const candidates = [];
    for (const entry of entries) {
        if (entry.isFile()) {
            const version = parseVersionFromName(entry.name);
            if (version && /^spec-v\d+\.\d+\.\d+\.md$/i.test(entry.name)) {
                candidates.push({
                    version,
                    fullPath: path.join(featureSpecDir, entry.name),
                });
            }
        }
        if (entry.isDirectory()) {
            const version = parseVersionFromName(entry.name);
            if (version) {
                const nestedSpec = path.join(featureSpecDir, entry.name, "spec.md");
                if (await exists(nestedSpec)) {
                    candidates.push({
                        version,
                        fullPath: nestedSpec,
                    });
                }
            }
        }
    }
    if (candidates.length === 0)
        return null;
    candidates.sort((a, b) => compareVersions(a.version, b.version));
    return candidates[candidates.length - 1].fullPath;
}
function extractSpecReference(traceabilityText) {
    const match = traceabilityText.match(/^Spec:\s+(.+)$/m);
    return match ? match[1].trim() : null;
}
function isValidSpecReferenceFormat(ref) {
    return (/^specs[\\/]+features[\\/]+[^\\/]+[\\/]spec-v\d+\.\d+\.\d+\.md$/i.test(ref) ||
        /^specs[\\/]+features[\\/]+[^\\/]+[\\/]v\d+\.\d+\.\d+[\\/]spec\.md$/i.test(ref));
}
function getMappingLines(traceabilityText) {
    return traceabilityText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^-+\s*AC[-\s]?\d+/i.test(line) || /^\|\s*AC[-\s]?\d+\s*\|/i.test(line));
}
function hasTraceabilityTableHeader(traceabilityText) {
    return /^\|\s*AC\s*\|\s*Critério\s*\|\s*Módulo\(s\)\s*\|\s*(Teste|Caso\(s\)\s+de\s+teste|Casos\s+de\s+teste)\s*\|/im.test(traceabilityText);
}
async function main() {
    if (!(await exists(FEATURES_SRC_ROOT))) {
        console.log("No src/features directory found. Skipping trace validation.");
        return;
    }
    if (!(await exists(FEATURES_SPEC_ROOT))) {
        console.log("No specs/features directory found. Skipping trace validation.");
        return;
    }
    const features = await readdir(FEATURES_SRC_ROOT, { withFileTypes: true });
    let hasErrors = false;
    for (const entry of features) {
        if (!entry.isDirectory())
            continue;
        const featureName = entry.name;
        const specDir = path.join(FEATURES_SPEC_ROOT, featureName);
        if (!(await exists(specDir))) {
            console.error(`[spec:trace] Missing specs directory for feature "${featureName}"`);
            hasErrors = true;
            continue;
        }
        const traceabilityPath = path.join(specDir, "TRACEABILITY.md");
        if (!(await exists(traceabilityPath))) {
            console.error(`[spec:trace] Missing TRACEABILITY.md for feature "${featureName}" at "${traceabilityPath}"`);
            hasErrors = true;
            continue;
        }
        const traceabilityText = await readFile(traceabilityPath, "utf8");
        if (!/^#\s+Traceability\b/m.test(traceabilityText)) {
            console.error(`[spec:trace] Invalid TRACEABILITY header for feature "${featureName}"`);
            hasErrors = true;
        }
        if (!/^##\s+Acceptance Criteria Mapping\b/m.test(traceabilityText)) {
            console.error(`[spec:trace] Missing "Acceptance Criteria Mapping" section in "${traceabilityPath}"`);
            hasErrors = true;
        }
        const specReference = extractSpecReference(traceabilityText);
        if (!specReference) {
            console.error(`[spec:trace] Missing spec reference in "${traceabilityPath}"`);
            hasErrors = true;
        }
        else {
            if (!isValidSpecReferenceFormat(specReference)) {
                console.error(`[spec:trace] Invalid spec reference format in "${traceabilityPath}": ${specReference}`);
                hasErrors = true;
            }
            else {
                const normalized = path.resolve(specReference);
                if (!(await exists(normalized))) {
                    const latestSpec = await findLatestSpecPath(specDir);
                    if (!latestSpec) {
                        console.error(`[spec:trace] Referenced spec does not exist and no spec versions were found for feature "${featureName}": ${specReference}`);
                    }
                    else {
                        console.error(`[spec:trace] Referenced spec does not exist: ${specReference}. Latest available spec is "${latestSpec}"`);
                    }
                    hasErrors = true;
                }
            }
        }
        const mappingLines = getMappingLines(traceabilityText);
        if (mappingLines.length === 0) {
            console.error(`[spec:trace] No AC mappings found in "${traceabilityPath}"`);
            hasErrors = true;
        }
        const hasTableRows = mappingLines.some((line) => /^\|/i.test(line));
        if (hasTableRows && !hasTraceabilityTableHeader(traceabilityText)) {
            console.error(`[spec:trace] Traceability table header is invalid or missing in "${traceabilityPath}"`);
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
