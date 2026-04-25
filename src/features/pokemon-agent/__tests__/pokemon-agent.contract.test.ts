import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPokemon, listPokemons } from "../../../../mcp/pokemon-service";

const PIKACHU_DETAIL = {
  id: 25,
  name: "pikachu",
  sprites: {
    front_default:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  },
  types: [{ type: { name: "electric" } }],
  stats: [
    { stat: { name: "hp" }, base_stat: 35 },
    { stat: { name: "attack" }, base_stat: 55 },
    { stat: { name: "defense" }, base_stat: 40 },
    { stat: { name: "speed" }, base_stat: 90 },
  ],
};

const LIST_RESPONSE = {
  count: 1302,
  results: [
    { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
    { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
  ],
};

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

describe("pokemon-agent — contrato listPokemons (AC1, AC2, AC3)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("AC1: chama a URL correta com limit=20 e offset=0 na listagem padrao", async () => {
    mockFetch(LIST_RESPONSE);

    await listPokemons(20, 0);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?limit=20&offset=0",
    );
  });

  it("AC1: retorna array de {name, url} para cada entrada", async () => {
    mockFetch(LIST_RESPONSE);

    const result = await listPokemons(20, 0);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" });
    expect(result[1]).toEqual({ name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" });
  });

  it("AC2: chama com offset=20 na segunda pagina", async () => {
    mockFetch(LIST_RESPONSE);

    await listPokemons(20, 20);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?limit=20&offset=20",
    );
  });

  it("AC3: chama com limit=100 para filtro local", async () => {
    mockFetch(LIST_RESPONSE);

    await listPokemons(100, 0);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?limit=100&offset=0",
    );
  });

  it("lanca erro quando PokeAPI retorna status nao-ok", async () => {
    mockFetch({}, 500);

    await expect(listPokemons(20, 0)).rejects.toThrow("PokéAPI retornou 500");
  });
});

describe("pokemon-agent — contrato getPokemon (AC4)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("AC4: chama a URL correta por nome", async () => {
    mockFetch(PIKACHU_DETAIL);

    await getPokemon("pikachu");

    expect(vi.mocked(fetch)).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/pikachu");
  });

  it("AC4: chama a URL correta por numero", async () => {
    mockFetch(PIKACHU_DETAIL);

    await getPokemon("25");

    expect(vi.mocked(fetch)).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/25");
  });

  it("AC4: retorna id, name, sprite, types e stats", async () => {
    mockFetch(PIKACHU_DETAIL);

    const result = await getPokemon("pikachu");

    expect(result.id).toBe(25);
    expect(result.name).toBe("pikachu");
    expect(result.sprite).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    );
    expect(result.types).toEqual(["electric"]);
    expect(result.stats).toContainEqual({ name: "hp", base: 35 });
    expect(result.stats).toContainEqual({ name: "attack", base: 55 });
    expect(result.stats).toContainEqual({ name: "speed", base: 90 });
  });

  it("lanca erro com mensagem incluindo o identificador quando PokeAPI retorna 404", async () => {
    mockFetch({}, 404);

    await expect(getPokemon("naoexiste")).rejects.toThrow('"naoexiste"');
  });
});

// AC5: o service retorna dados brutos (sem tradução); a formatação em pt-BR é responsabilidade
// do agente definido em .claude/agents/pokemon-agent.md — verificação manual pelo agente.
describe("pokemon-agent — AC5 (dados brutos sem formatação de idioma)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("AC5: listPokemons retorna name e url sem transformacao de idioma", async () => {
    mockFetch(LIST_RESPONSE);
    const result = await listPokemons(20, 0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("url");
  });

  it("AC5: getPokemon retorna campos estruturados sem texto em idioma especifico", async () => {
    mockFetch(PIKACHU_DETAIL);
    const result = await getPokemon("pikachu");
    expect(typeof result.id).toBe("number");
    expect(typeof result.name).toBe("string");
    expect(Array.isArray(result.types)).toBe(true);
    expect(Array.isArray(result.stats)).toBe(true);
  });
});
