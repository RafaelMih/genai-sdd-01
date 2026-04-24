// src/routes/private.routes.tsx
import { useEffect } from "react";
import { Route, useNavigate } from "react-router-dom";
import { useAuthState } from "../features/auth/useAuthState";
import { LogoutButton } from "../features/user-logout/LogoutButton";
import { PokemonList } from "../features/pokemon-list/PokemonList";

function DashboardPage() {
  const user = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  if (user === undefined || user === null) {
    return null;
  }

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
