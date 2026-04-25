import { createHash } from "node:crypto";
import { Stats } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type ContextCacheMode = "summary" | "full" | "chunked";
export type ContextIntent = "implement" | "test" | "review" | "drift";

type CachePayload = {
  createdAt: string;
  key: string;
  content: string;
  metadata: Record<string, string | number | boolean | null>;
};

const CACHE_ROOT = path.resolve(".telemetry", "cache", "context");

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function getFileFingerprint(filePath: string): Promise<string> {
  const fileStats: Stats = await stat(filePath);
  return `${filePath}:${fileStats.size}:${fileStats.mtimeMs}`;
}

export async function buildContextCacheKey(input: {
  feature: string;
  version?: string | null;
  mode: ContextCacheMode;
  intent?: ContextIntent;
  scope?: string;
  files: string[];
}): Promise<string> {
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
    intent: input.intent ?? null,
    scope: input.scope ?? null,
    files: fileFingerprints,
  });

  return createHash("sha256").update(rawKey).digest("hex");
}

function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_ROOT, `${cacheKey}.json`);
}

export async function readContextCache(cacheKey: string): Promise<CachePayload | null> {
  const cacheFilePath = getCacheFilePath(cacheKey);

  if (!(await pathExists(cacheFilePath))) {
    return null;
  }

  const raw = await readFile(cacheFilePath, "utf8");
  return JSON.parse(raw) as CachePayload;
}

export async function writeContextCache(input: {
  cacheKey: string;
  content: string;
  metadata: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await mkdir(CACHE_ROOT, { recursive: true });

  const payload: CachePayload = {
    createdAt: new Date().toISOString(),
    key: input.cacheKey,
    content: input.content,
    metadata: input.metadata,
  };

  await writeFile(getCacheFilePath(input.cacheKey), JSON.stringify(payload, null, 2), "utf8");
}
