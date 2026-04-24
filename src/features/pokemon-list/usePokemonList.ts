import { useEffect, useState } from "react";
import { type Pokemon, fetchPokemons } from "./pokemonService";

type PokemonListState = {
  pokemons: Pokemon[];
  loading: boolean;
  error: boolean;
};

export function usePokemonList(): PokemonListState {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPokemons()
      .then((data) => {
        if (!cancelled) {
          setPokemons(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { pokemons, loading, error };
}
