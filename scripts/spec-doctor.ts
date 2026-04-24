import { spawnSync } from "node:child_process";

const fix = process.argv.includes("--fix");

type Step = {
  name: string;
  command: string;
  args: string[];
  optional?: boolean;
};

const steps: Step[] = [
  {
    name: "Format check",
    command: "npm",
    args: ["run", fix ? "format" : "format:check"],
  },
  {
    name: "Spec lint",
    command: "npm",
    args: ["run", "spec:lint"],
  },
  {
    name: "Spec status",
    command: "npm",
    args: ["run", "spec:status"],
  },
  {
    name: "Traceability check",
    command: "npm",
    args: ["run", "spec:trace"],
  },
  {
    name: "Acceptance criteria coverage",
    command: "npm",
    args: ["run", "spec:coverage"],
  },
  {
    name: "Drift check",
    command: "npm",
    args: ["run", "spec:drift"],
  },
  {
    name: "Generate feature contexts/chunks",
    command: "npm",
    args: ["run", "context:generate"],
  },
  {
    name: "Index specs for RAG",
    command: "npm",
    args: ["run", "index:specs"],
  },
  {
    name: "Context telemetry report",
    command: "npm",
    args: ["run", "context:report"],
  },
  {
    name: "Archive old spec versions",
    command: "npm",
    args: ["run", "specs:archive"],
  },
];

let failed = false;

for (const step of steps) {
  console.log(`\n▶ ${step.name}`);
  console.log(`$ ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    if (step.optional) {
      console.warn(`⚠ ${step.name} failed but is optional.`);
      continue;
    }

    console.error(`\n✖ Failed: ${step.name}`);
    failed = true;
    break;
  }

  console.log(`✓ ${step.name}`);
}

if (failed) {
  process.exit(1);
}

console.log("\n✅ Specs doctor completed successfully.");
