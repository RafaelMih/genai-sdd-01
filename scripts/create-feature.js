#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
function toTitleCase(input) {
    return input
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function assertValidFeatureName(name) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        throw new Error('Invalid feature name. Use kebab-case only, e.g. "auth" or "user-profile".');
    }
}
async function exists(target) {
    try {
        await access(target);
        return true;
    }
    catch {
        return false;
    }
}
async function main() {
    const featureName = process.argv[2];
    if (!featureName) {
        throw new Error("Usage: npm run create:feature -- <feature-name>");
    }
    assertValidFeatureName(featureName);
    const featureTitle = toTitleCase(featureName);
    const specDir = path.join("specs", "features", featureName);
    const srcDir = path.join("src", "features", featureName);
    const version = "1.0.0";
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
- AC-01: Replace this with a testable behavior
- AC-02: Replace this with a testable behavior

## Dependencies
- specs/technical/<relevant-contract>.md
- specs/decisions/<relevant-adr>.md

## Tests
- unit:
- integration:
- e2e:

## Open questions
- none
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
- AC-01 -> <file.tsx>
- AC-02 -> <file.ts>
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
    await writeFile(path.join(specDir, `spec-v${version}.md`), specContent, "utf8");
    await writeFile(path.join(specDir, `tasks-v${version}.md`), tasksContent, "utf8");
    await writeFile(path.join(specDir, "changelog.md"), changelogContent, "utf8");
    await writeFile(path.join(srcDir, "TRACEABILITY.md"), traceabilityContent, "utf8");
    await writeFile(path.join(srcDir, "README.md"), readmeContent, "utf8");
    console.log(`Feature scaffold created successfully:
- ${specDir}
- ${srcDir}`);
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
});
