import fs from "node:fs";
import path from "node:path";

const root = path.resolve("specs/features");

type SpecInfo = {
  file: string;
  feature: string;
  version: [number, number, number];
};

function parseVersion(file: string): [number, number, number] | null {
  const match = file.match(/spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

function walk(dir: string): SpecInfo[] {
  const out: SpecInfo[] = [];

  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }

    if (!/spec-v\d+\.\d+\.\d+\.md$/i.test(entry.name)) continue;

    const version = parseVersion(entry.name);
    if (!version) continue;

    const feature = path.basename(path.dirname(full));

    out.push({
      file: full,
      feature,
      version,
    });
  }

  return out;
}

function selectLatestByFeature(specs: SpecInfo[]): SpecInfo[] {
  const latestByFeature = new Map<string, SpecInfo>();

  for (const spec of specs) {
    const current = latestByFeature.get(spec.feature);

    if (!current || compareVersions(spec.version, current.version) > 0) {
      latestByFeature.set(spec.feature, spec);
    }
  }

  return [...latestByFeature.values()].sort((a, b) => a.feature.localeCompare(b.feature));
}

const latestSpecs = selectLatestByFeature(walk(root));

let failed = false;

for (const spec of latestSpecs) {
  const text = fs.readFileSync(spec.file, "utf8");

  const statusMatch = text.match(/^Status:\s+(.*)$/m);
  const status = statusMatch?.[1]?.trim();

  if (status !== "Approved") {
    failed = true;
    console.error(`[spec-status] ${spec.file} is NOT Approved (found: ${status ?? "missing"})`);
  }
}

if (failed) process.exit(1);

console.log("Latest specs approved");
