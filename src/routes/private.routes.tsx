// src/routes/private.routes.tsx
import { Route } from "react-router-dom";
import { LogoutButton } from "../features/user-logout/LogoutButton";

function DashboardPage() {
  return (
    <div>
      <div className="p-6">Dashboard</div>
      <LogoutButton />
    </div>
  );
}

export function PrivateRoutes() {
  return <Route path="/dashboard" element={<DashboardPage />} />;
}
