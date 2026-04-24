import { type Pokemon, capitalizeName, formatPokemonNumber } from "./pokemonService";

type Props = {
  pokemon: Pokemon;
};

export function PokemonCard({ pokemon }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <img src={pokemon.spriteUrl} alt={pokemon.name} className="h-16 w-16" />
      <span className="text-xs text-zinc-400">{formatPokemonNumber(pokemon.id)}</span>
      <span className="text-sm font-medium text-zinc-800">{capitalizeName(pokemon.name)}</span>
    </div>
  );
}
