import fs from "node:fs";
import path from "node:path";
const root = path.resolve("specs/features");
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/spec-v\d+\.\d+\.\d+\.md$/i.test(entry.name)) out.push(full);
  }
  return out;
}
let failed = false;
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  const statusMatch = text.match(/^Status:\s+(.*)$/m);
  const status = statusMatch?.[1]?.trim();
  if (status !== "Approved") {
    failed = true;
    console.error(`[spec-status] ${file} is NOT Approved (found: ${status})`);
  }
}
if (failed) process.exit(1);
console.log("All specs approved");
