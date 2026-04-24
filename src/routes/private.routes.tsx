// src/routes/private.routes.tsx
import { Route } from "react-router-dom";
import { LogoutButton } from "../features/user-logout/LogoutButton";
import { PokemonList } from "../features/pokemon-list/PokemonList";

function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between p-6">
        <span className="font-semibold text-zinc-900">Dashboard</span>
        <LogoutButton />
      </div>
      <PokemonList />
    </div>
  );
}

export function PrivateRoutes() {
  return <Route path="/dashboard" element={<DashboardPage />} />;
}
