import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
const CACHE_ROOT = path.resolve(".telemetry", "cache", "context");
async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}
async function getFileFingerprint(filePath) {
  const fileStats = await stat(filePath);
  return `${filePath}:${fileStats.size}:${fileStats.mtimeMs}`;
}
export async function buildContextCacheKey(input) {
  const fileFingerprints = await Promise.all(
    [...new Set(input.files)].sort().map(async (filePath) => {
      if (!(await pathExists(filePath))) {
        return `${filePath}:missing`;
      }
      return getFileFingerprint(filePath);
    }),
  );
  const rawKey = JSON.stringify({
    feature: input.feature,
    version: input.version ?? null,
    mode: input.mode,
    files: fileFingerprints,
  });
  return createHash("sha256").update(rawKey).digest("hex");
}
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_ROOT, `${cacheKey}.json`);
}
export async function readContextCache(cacheKey) {
  const cacheFilePath = getCacheFilePath(cacheKey);
  if (!(await pathExists(cacheFilePath))) {
    return null;
  }
  const raw = await readFile(cacheFilePath, "utf8");
  return JSON.parse(raw);
}
export async function writeContextCache(input) {
  await mkdir(CACHE_ROOT, { recursive: true });
  const payload = {
    createdAt: new Date().toISOString(),
    key: input.cacheKey,
    content: input.content,
    metadata: input.metadata,
  };
  await writeFile(getCacheFilePath(input.cacheKey), JSON.stringify(payload, null, 2), "utf8");
}
