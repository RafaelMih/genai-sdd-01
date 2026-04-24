import { PokemonCard } from "./PokemonCard";
import { usePokemonList } from "./usePokemonList";

export function PokemonList() {
  const { pokemons, loading, error } = usePokemonList();

  if (loading) {
    return <p className="px-6 text-sm text-zinc-500">Carregando Pokémons...</p>;
  }

  if (error) {
    return <p className="px-6 text-sm text-red-600">Erro ao carregar Pokémons. Tente novamente.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-4 md:grid-cols-5">
      {pokemons.map((p) => (
        <PokemonCard key={p.id} pokemon={p} />
      ))}
    </div>
  );
}
