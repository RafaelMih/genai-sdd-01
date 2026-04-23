#!/usr/bin/env node
import { execSync } from "node:child_process";
import process from "node:process";
const commands = [
    'npm run spec:lint',
    'npm run spec:trace',
];
try {
    for (const command of commands) {
        console.log(`\n[precommit] Running: ${command}`);
        execSync(command, { stdio: "inherit" });
    }
    console.log("\n[precommit] All validations passed.");
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n[precommit] Commit blocked.\n${message}`);
    process.exit(1);
}
