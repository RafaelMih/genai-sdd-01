import { useEffect, useState } from "react";
import { PokemonCard } from "./PokemonCard";
import { filterPokemonsByName } from "./pokemonService";
import { usePokemonList } from "./usePokemonList";

export function PokemonList() {
  const { pokemons, loading, error } = usePokemonList();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  if (loading) {
    return <p className="px-6 text-sm text-zinc-500">Carregando Pokemons...</p>;
  }

  if (error) {
    return <p className="px-6 text-sm text-red-600">Erro ao carregar Pokemons. Tente novamente.</p>;
  }

  const filteredPokemons = filterPokemonsByName(pokemons, debouncedQuery);

  return (
    <div className="px-6 pb-6">
      <div className="mb-4">
        <label
          htmlFor="pokemon-name-filter"
          className="mb-1 block text-sm font-medium text-zinc-700"
        >
          Filtrar por nome
        </label>
        <input
          id="pokemon-name-filter"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite o nome do Pokemon"
          className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {filteredPokemons.map((pokemon) => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>
    </div>
  );
}
