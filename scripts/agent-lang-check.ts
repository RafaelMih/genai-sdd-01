#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { detectLanguage } from "./detect-language.js";

const AGENTS_ROOT = path.resolve(".claude", "agents");

function extractCodeBlocks(content: string): string[] {
  const blocks: string[] = [];
  for (const match of content.matchAll(/```[\w]*\n([\s\S]*?)```/g)) {
    blocks.push(match[1]);
  }
  return blocks;
}

function hasLanguageMandate(content: string): boolean {
  return /pt-BR|pt_BR|portugu[êe]s|responder em pt/i.test(content);
}

function collectAgentFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectAgentFiles(full));
    else if (/\.md$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const agentFiles = collectAgentFiles(AGENTS_ROOT);

if (agentFiles.length === 0) {
  console.log("agent:lang-check — nenhum agente encontrado em .claude/agents/");
  process.exit(0);
}

let hasErrors = false;
let hasWarnings = false;

for (const file of agentFiles) {
  const label = path.relative(path.resolve(".claude"), file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");

  if (!hasLanguageMandate(content)) {
    console.error(
      `[agent:lang-check] ${label}: sem mandato de idioma explícito (esperado: "pt-BR")`,
    );
    hasErrors = true;
    continue;
  }

  const blocks = extractCodeBlocks(content);
  let englishBlocks = 0;
  for (const block of blocks) {
    if (detectLanguage(block) === "en") englishBlocks++;
  }

  if (englishBlocks > 0) {
    console.warn(
      `[agent:lang-check] ${label}: ${englishBlocks} bloco(s) de exemplo detectado(s) como inglês — verificar manualmente`,
    );
    hasWarnings = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

if (hasWarnings) {
  console.log("agent:lang-check passed with warnings");
} else {
  console.log("agent:lang-check passed");
}
