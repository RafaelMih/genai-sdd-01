#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
const MANIFEST_PATH = path.resolve("specs", ".index", "spec-manifest.json");
const FEATURES_ROOT = path.resolve("specs", "features");
const ARCHIVE_ROOT = path.resolve("specs", "archive");
function parseVersion(fileName) {
    const match = fileName.match(/^spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
    if (!match)
        return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}
function compareVersions(left, right) {
    if (left[0] !== right[0])
        return left[0] - right[0];
    if (left[1] !== right[1])
        return left[1] - right[1];
    return left[2] - right[2];
}
async function pathExists(target) {
    try {
        await stat(target);
        return true;
    }
    catch {
        return false;
    }
}
async function loadManifest() {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    return JSON.parse(raw);
}
async function saveManifest(entries) {
    await writeFile(MANIFEST_PATH, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}
async function appendArchivePointer(featureDir, feature, archivedFiles) {
    const changelogPath = path.join(featureDir, "changelog.md");
    if (!(await pathExists(changelogPath)) || archivedFiles.length === 0)
        return;
    const changelog = await readFile(changelogPath, "utf8");
    const pointer = `\n## Archived specs\n- Historical specs moved to \`specs/archive/${feature}/\`: ${archivedFiles.join(", ")}\n`;
    if (changelog.includes("## Archived specs"))
        return;
    await writeFile(changelogPath, `${changelog.trimEnd()}\n${pointer}`, "utf8");
}
async function archiveFeatureSpecs(feature, manifest) {
    const featureDir = path.join(FEATURES_ROOT, feature);
    const archiveDir = path.join(ARCHIVE_ROOT, feature);
    await mkdir(archiveDir, { recursive: true });
    const specFiles = (await readdir(featureDir))
        .filter((fileName) => /^spec-v\d+\.\d+\.\d+\.md$/i.test(fileName))
        .sort((left, right) => compareVersions(parseVersion(left), parseVersion(right)));
    if (specFiles.length <= 1)
        return [];
    const activeFile = specFiles[specFiles.length - 1];
    const featureManifestEntries = manifest.filter((entry) => entry.type === "feature" && entry.feature === feature);
    const archived = [];
    for (const fileName of specFiles) {
        if (fileName === activeFile) {
            for (const manifestEntry of featureManifestEntries) {
                if (path.basename(manifestEntry.path) === fileName) {
                    manifestEntry.status = "active";
                }
            }
            continue;
        }
        const fromPath = path.join(featureDir, fileName);
        const toPath = path.join(archiveDir, fileName);
        if (await pathExists(fromPath)) {
            await rename(fromPath, toPath);
        }
        for (const manifestEntry of featureManifestEntries) {
            if (path.basename(manifestEntry.path) !== fileName)
                continue;
            manifestEntry.path = path.relative(process.cwd(), toPath).replace(/\\/g, "/");
            manifestEntry.status = "archived";
        }
        archived.push(fileName);
    }
    await appendArchivePointer(featureDir, feature, archived);
    return archived;
}
async function main() {
    const manifest = await loadManifest();
    const features = [
        ...new Set(manifest.filter((entry) => entry.feature).map((entry) => entry.feature)),
    ];
    const summary = [];
    for (const feature of features) {
        const archived = await archiveFeatureSpecs(feature, manifest);
        if (archived.length > 0) {
            summary.push({ feature, archived });
        }
    }
    await saveManifest(manifest);
    if (summary.length === 0) {
        console.log("No superseded specs needed archiving.");
        return;
    }
    for (const item of summary) {
        console.log(`${item.feature}: archived ${item.archived.join(", ")}`);
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
