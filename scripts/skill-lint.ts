#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SKILLS_ROOT = path.resolve(".claude", "skills");
const AGENTS_ROOT = path.resolve(".claude", "agents");

type Issue = { severity: "BLOCKER" | "WARN"; message: string };

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_-]+)\s*:\s*(.+)$/);
    if (kv) result[kv[1].trim()] = kv[2].trim();
  }
  return result;
}

function lintFile(file: string, label: string): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontmatter(content);

  if (!fm["name"]) {
    issues.push({ severity: "BLOCKER", message: `Frontmatter ausente: "name"` });
  }
  if (!fm["description"]) {
    issues.push({ severity: "BLOCKER", message: `Frontmatter ausente: "description"` });
  }
  if (fm["description"] && fm["description"].length < 20) {
    issues.push({ severity: "WARN", message: `"description" muito curta (< 20 chars)` });
  }
  if (!content.match(/^##\s+/m)) {
    issues.push({ severity: "BLOCKER", message: `Nenhuma seção H2 encontrada` });
  }

  const hasAcRef = /AC\d+/i.test(content);
  const hasOutputSection = /^##[^#\n]*(?:output|saída|saida|resultado)/im.test(content);
  if (!hasAcRef && !hasOutputSection) {
    issues.push({
      severity: "WARN",
      message: `Sem referência a AC (ex: AC1) nem seção de outputs (## Output / ## Saída / ## Resultado)`,
    });
  }

  return issues;
}

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(full));
    } else if (/\.md$/i.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

const skillFiles = collectMarkdownFiles(SKILLS_ROOT);
const agentFiles = collectMarkdownFiles(AGENTS_ROOT);
const allFiles = [...skillFiles, ...agentFiles];

if (allFiles.length === 0) {
  console.log("skill:lint — nenhum arquivo encontrado em .claude/skills/ ou .claude/agents/");
  process.exit(0);
}

let hasBlocker = false;
let hasWarn = false;

for (const file of allFiles) {
  const label = path.relative(path.resolve(".claude"), file).replace(/\\/g, "/");
  const issues = lintFile(file, label);

  if (issues.length === 0) continue;

  console.error(`\n[skill:lint] ${label}`);
  for (const issue of issues) {
    if (issue.severity === "BLOCKER") hasBlocker = true;
    if (issue.severity === "WARN") hasWarn = true;
    console.error(`  - [${issue.severity}] ${issue.message}`);
  }
}

if (hasBlocker) {
  process.exit(1);
}

if (hasWarn) {
  console.log("skill:lint passed with warnings");
} else {
  console.log("skill:lint passed");
}
