import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSpriteUrl,
  capitalizeName,
  fetchPokemons,
  formatPokemonNumber,
  parseIdFromUrl,
} from "../pokemonService";

describe("parseIdFromUrl", () => {
  // AC2, AC3
  it("extrai o ID correto de uma URL de Pokémon", () => {
    expect(parseIdFromUrl("https://pokeapi.co/api/v2/pokemon/1/")).toBe(1);
    expect(parseIdFromUrl("https://pokeapi.co/api/v2/pokemon/25/")).toBe(25);
    expect(parseIdFromUrl("https://pokeapi.co/api/v2/pokemon/151/")).toBe(151);
  });

  it("lança erro para URL inválida", () => {
    expect(() => parseIdFromUrl("https://pokeapi.co/api/v2/pokemon/bulbasaur")).toThrow();
  });
});

describe("buildSpriteUrl", () => {
  // AC2
  it("constrói URL de sprite correta para o ID", () => {
    expect(buildSpriteUrl(1)).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    );
    expect(buildSpriteUrl(25)).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    );
  });
});

describe("formatPokemonNumber", () => {
  // AC2
  it("formata número com padding de 3 dígitos", () => {
    expect(formatPokemonNumber(1)).toBe("#001");
    expect(formatPokemonNumber(25)).toBe("#025");
    expect(formatPokemonNumber(151)).toBe("#151");
    expect(formatPokemonNumber(1000)).toBe("#1000");
  });
});

describe("capitalizeName", () => {
  // AC2
  it("capitaliza a primeira letra do nome", () => {
    expect(capitalizeName("bulbasaur")).toBe("Bulbasaur");
    expect(capitalizeName("mr-mime")).toBe("Mr-mime");
    expect(capitalizeName("pikachu")).toBe("Pikachu");
  });
});

describe("fetchPokemons", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // AC3
  it("retorna lista com id, name e spriteUrl para cada Pokémon", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
            { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
          ],
        }),
      }),
    );

    const result = await fetchPokemons();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      name: "bulbasaur",
      spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    });
    expect(result[1]).toEqual({
      id: 2,
      name: "ivysaur",
      spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png",
    });
  });

  // AC5
  it("lança erro em falha de rede (fetch rejeita)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    await expect(fetchPokemons()).rejects.toThrow();
  });

  // AC5
  it("lança erro quando API retorna status não-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchPokemons()).rejects.toThrow("Erro 500");
  });
});
