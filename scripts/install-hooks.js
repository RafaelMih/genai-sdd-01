#!/usr/bin/env node
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const HOOKS_DIR = path.resolve(".git", "hooks");
const HOOK_PATH = path.join(HOOKS_DIR, "pre-commit");
const HOOK_CONTENT = "#!/bin/sh\nnpm run precommit:spec\n";
async function main() {
  try {
    await mkdir(HOOKS_DIR, { recursive: true });
    await writeFile(HOOK_PATH, HOOK_CONTENT, "utf8");
    try {
      await chmod(HOOK_PATH, 0o755);
    } catch {
      // chmod may not work on Windows; git reads the file regardless
    }
    console.log("[install-hooks] pre-commit hook installed.");
  } catch {
    // .git not found (CI environment); skip silently
  }
}
main();
