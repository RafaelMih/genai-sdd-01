/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectLanguage } from "../../../../scripts/detect-language.js";

const AGENT_FILE = path.resolve(".claude", "agents", "pokemon-agent.md");

describe("detectLanguage — heurística de idioma", () => {
  it("identifica texto em pt-BR", () => {
    const text =
      "Nenhum pokémon foi encontrado com esse nome. Por favor, tente novamente com outro termo.";
    expect(detectLanguage(text)).toBe("pt-BR");
  });

  it("identifica texto em inglês", () => {
    const text =
      "No pokemon was found with that name. Please try again with a different search term.";
    expect(detectLanguage(text)).toBe("en");
  });

  it("retorna unknown para texto muito curto", () => {
    expect(detectLanguage("ok")).toBe("unknown");
  });

  it("retorna unknown para texto sem palavras marcadoras", () => {
    expect(detectLanguage("Pikachu Bulbasaur Charmander Squirtle")).toBe("unknown");
  });
});

describe("pokemon-agent — AC5: mandato de idioma no arquivo de definição", () => {
  it("AC5: o arquivo do agente contém mandato explícito de pt-BR", () => {
    const content = fs.readFileSync(AGENT_FILE, "utf8");
    expect(content).toMatch(/pt-BR/);
  });

  it("AC5: o arquivo do agente contém regra explícita de resposta em pt-BR", () => {
    const content = fs.readFileSync(AGENT_FILE, "utf8");
    expect(content).toMatch(/Sempre responder em pt-BR/i);
  });

  it("AC5: o arquivo do agente possui seção de regras de idioma", () => {
    const content = fs.readFileSync(AGENT_FILE, "utf8");
    expect(content).toMatch(/^## Regras/m);
  });
});
