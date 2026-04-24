import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PokemonList } from "../PokemonList";
import * as usePokemonListModule from "../usePokemonList";

describe("PokemonList", () => {
  // AC4
  it("exibe 'Carregando Pokémons...' durante o fetch", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [],
      loading: true,
      error: false,
    });

    render(<PokemonList />);

    expect(screen.getByText("Carregando Pokémons...")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  // AC5
  it("exibe mensagem de erro após falha do fetch", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [],
      loading: false,
      error: true,
    });

    render(<PokemonList />);

    expect(
      screen.getByText("Erro ao carregar Pokémons. Tente novamente."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  // AC1, AC2, AC3
  it("exibe grade de cards após fetch bem-sucedido", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [
        {
          id: 1,
          name: "bulbasaur",
          spriteUrl:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
        },
        {
          id: 2,
          name: "ivysaur",
          spriteUrl:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png",
        },
      ],
      loading: false,
      error: false,
    });

    render(<PokemonList />);

    // AC1: cards renderizados
    expect(screen.getAllByRole("img")).toHaveLength(2);

    // AC2: número formatado
    expect(screen.getByText("#001")).toBeInTheDocument();
    expect(screen.getByText("#002")).toBeInTheDocument();

    // AC2: nome capitalizado
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("Ivysaur")).toBeInTheDocument();

    // AC2: sprite com alt correto
    expect(screen.getByAltText("bulbasaur")).toBeInTheDocument();
    expect(screen.getByAltText("ivysaur")).toBeInTheDocument();
  });
});
