#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function toTitleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function assertValidFeatureName(name: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      'Invalid feature name. Use kebab-case only, e.g. "auth" or "user-profile".',
    );
  }
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const featureName = process.argv[2];
  const version = process.argv[3] ?? "1.0.0";

  if (!featureName) {
    throw new Error(
      "Usage: npm run create:feature -- <feature-name> [version]",
    );
  }

  assertValidFeatureName(featureName);

  const featureTitle = toTitleCase(featureName);
  const specDir = path.join("specs", "features", featureName);
  const srcDir = path.join("src", "features", featureName);

  if (await exists(specDir)) {
    throw new Error(`Feature already exists: ${specDir}`);
  }

  await mkdir(specDir, { recursive: true });
  await mkdir(path.join(srcDir, "components"), { recursive: true });
  await mkdir(path.join(srcDir, "hooks"), { recursive: true });
  await mkdir(path.join(srcDir, "services"), { recursive: true });
  await mkdir(path.join(srcDir, "tests"), { recursive: true });

  const specContent = `# Feature Spec: ${featureTitle}
Version: ${version}
Status: Draft

## Objective
Describe the feature outcome in one sentence.

## Scope
- item 1
- item 2

## Out of scope
- item 1
- item 2

## User flow
1. User does something
2. System validates
3. System completes the action

## Acceptance criteria
- AC1: Replace this with a testable behavior
- AC2: Replace this with a testable behavior

## Dependencies
- None

## Tests
- unit:
- integration:
- e2e:

## Open questions
- None
`;

  const tasksContent = `# Tasks - ${featureTitle} v${version}

- [ ] Finalize the spec
- [ ] Implement UI
- [ ] Implement service logic
- [ ] Add tests
- [ ] Update TRACEABILITY.md
`;

  const changelogContent = `# Changelog - ${featureTitle}

## v${version}
- Initial feature spec
`;

  const traceabilityContent = `# Traceability - ${featureTitle}

Spec: specs/features/${featureName}/spec-v${version}.md

## Acceptance Criteria Mapping

| AC | Criteria | Module(s) | Test(s) |
|----|----------|-----------|---------|
| AC1 | TBD | TBD | TBD |
| AC2 | TBD | TBD | TBD |
`;

  const readmeContent = `# ${featureTitle}

This folder contains the ${featureName} feature implementation.

## Expected structure
- components/
- hooks/
- services/
- tests/
- TRACEABILITY.md
`;

  await writeFile(
    path.join(specDir, `spec-v${version}.md`),
    specContent,
    "utf8",
  );
  await writeFile(
    path.join(specDir, `tasks-v${version}.md`),
    tasksContent,
    "utf8",
  );
  await writeFile(path.join(specDir, "changelog.md"), changelogContent, "utf8");
  await writeFile(
    path.join(srcDir, "TRACEABILITY.md"),
    traceabilityContent,
    "utf8",
  );
  await writeFile(path.join(srcDir, "README.md"), readmeContent, "utf8");

  // ---- Manifest update (RAG support) ----
  const manifestDir = path.join("specs", ".index");
  const manifestPath = path.join(manifestDir, "spec-manifest.json");

  await mkdir(manifestDir, { recursive: true });

  type ManifestEntry = {
    id: string;
    path: string;
    type: "feature";
    feature: string;
    version: string;
    dependsOn: string[];
  };

  const manifestExists = await exists(manifestPath);

  const manifest: ManifestEntry[] = manifestExists
    ? JSON.parse(await readFile(manifestPath, "utf8"))
    : [];

  const manifestEntry: ManifestEntry = {
    id: `feature-${featureName}-v${version}`,
    path: `specs/features/${featureName}/spec-v${version}.md`,
    type: "feature",
    feature: featureName,
    version,
    dependsOn: [],
  };

  if (!manifest.some((entry) => entry.id === manifestEntry.id)) {
    manifest.push(manifestEntry);
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
  }

  console.log(`Feature scaffold created successfully:
- ${specDir}
- ${srcDir}
- manifest updated`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
