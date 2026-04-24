// src/routes/index.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoutes } from "./private.routes";
import { PublicRoutes } from "./public.routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {PublicRoutes()}
      {PrivateRoutes()}
    </Routes>
  );
}
