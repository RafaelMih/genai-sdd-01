import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

type McpServerConfig = {
  name: string;
  command: string;
  args: string[];
};

const repoRoot = process.cwd();
const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");
const tsxCommand = path.join(repoRoot, "node_modules", ".bin", "tsx.cmd");

const servers: McpServerConfig[] = [
  {
    name: "spec-rag",
    command: tsxCommand,
    args: [path.join(repoRoot, "mcp", "spec-rag-mcp.ts")],
  },
  {
    name: "pokemon",
    command: tsxCommand,
    args: [path.join(repoRoot, "mcp", "pokemon-mcp.ts")],
  },
];

const dryRun = process.argv.includes("--dry-run");

function toTomlString(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function renderServerBlock(server: McpServerConfig) {
  const args = server.args.map(toTomlString).join(", ");

  return [
    `[mcp_servers.${JSON.stringify(server.name).slice(1, -1)}]`,
    `command = ${toTomlString(server.command)}`,
    `args = [${args}]`,
    "",
  ].join("\n");
}

function removeServerSections(configText: string, serverNames: string[]) {
  const lines = configText.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const sectionMatch = line.match(/^\[(.+)\]$/);

    if (sectionMatch) {
      const sectionName = sectionMatch[1];
      const shouldSkip = serverNames.some(
        (serverName) =>
          sectionName === `mcp_servers.${serverName}` ||
          sectionName.startsWith(`mcp_servers.${serverName}.`),
      );

      skipping = shouldSkip;
    }

    if (!skipping) {
      kept.push(line);
    }
  }

  return kept.join("\n").trimEnd();
}

async function loadExistingConfig() {
  try {
    return await readFile(codexConfigPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

async function main() {
  const existingConfig = await loadExistingConfig();
  const cleanedConfig = removeServerSections(
    existingConfig,
    servers.map((server) => server.name),
  );
  const serverBlocks = servers.map(renderServerBlock).join("\n");
  const nextConfig = [cleanedConfig, serverBlocks]
    .filter((block) => block.trim().length > 0)
    .join("\n\n")
    .trimEnd()
    .concat("\n");

  if (dryRun) {
    process.stdout.write(
      `Would update ${codexConfigPath} with:\n\n${serverBlocks}`,
    );
    return;
  }

  await mkdir(path.dirname(codexConfigPath), { recursive: true });
  await writeFile(codexConfigPath, nextConfig, "utf8");

  process.stdout.write(
    [
      `Updated ${codexConfigPath}`,
      "",
      "Registered MCP servers:",
      ...servers.map((server) => `- ${server.name}`),
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
