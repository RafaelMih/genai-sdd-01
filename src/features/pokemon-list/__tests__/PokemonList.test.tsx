import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PokemonList } from "../PokemonList";
import * as usePokemonListModule from "../usePokemonList";

describe("PokemonList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // AC4
  it("exibe 'Carregando Pokemons...' durante o fetch", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [],
      loading: true,
      error: false,
    });

    render(<PokemonList />);

    expect(screen.getByText("Carregando Pokemons...")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  // AC5
  it("exibe mensagem de erro apos falha do fetch", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [],
      loading: false,
      error: true,
    });

    render(<PokemonList />);

    expect(screen.getByText("Erro ao carregar Pokemons. Tente novamente.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  // AC1, AC2, AC3
  it("exibe grade de cards apos fetch bem-sucedido", () => {
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

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("#001")).toBeInTheDocument();
    expect(screen.getByText("#002")).toBeInTheDocument();
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("Ivysaur")).toBeInTheDocument();
    expect(screen.getByAltText("bulbasaur")).toBeInTheDocument();
    expect(screen.getByAltText("ivysaur")).toBeInTheDocument();
  });

  // AC6
  it("exibe input de filtro apos sucesso", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [{ id: 1, name: "bulbasaur", spriteUrl: "sprite-1" }],
      loading: false,
      error: false,
    });

    render(<PokemonList />);

    expect(screen.getByLabelText("Filtrar por nome")).toBeInTheDocument();
  });

  // AC7, AC8
  it("aplica o filtro apenas apos 2 segundos de inatividade", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [
        { id: 1, name: "bulbasaur", spriteUrl: "sprite-1" },
        { id: 2, name: "ivysaur", spriteUrl: "sprite-2" },
        { id: 3, name: "pikachu", spriteUrl: "sprite-3" },
      ],
      loading: false,
      error: false,
    });

    render(<PokemonList />);

    const input = screen.getByLabelText("Filtrar por nome");
    fireEvent.change(input, { target: { value: "saur" } });

    expect(screen.getAllByRole("img")).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getAllByRole("img")).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("Ivysaur")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu")).toBeNull();
  });

  // AC9
  it("restaura a lista completa quando o input fica vazio", () => {
    vi.spyOn(usePokemonListModule, "usePokemonList").mockReturnValue({
      pokemons: [
        { id: 1, name: "bulbasaur", spriteUrl: "sprite-1" },
        { id: 2, name: "ivysaur", spriteUrl: "sprite-2" },
        { id: 3, name: "pikachu", spriteUrl: "sprite-3" },
      ],
      loading: false,
      error: false,
    });

    render(<PokemonList />);

    const input = screen.getByLabelText("Filtrar por nome");
    fireEvent.change(input, { target: { value: "saur" } });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getAllByRole("img")).toHaveLength(2);

    fireEvent.change(input, { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});
