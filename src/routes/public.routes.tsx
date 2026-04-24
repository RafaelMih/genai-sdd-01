// src/routes/public.routes.tsx
import { Route } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/user-signup/SignupPage";

export function PublicRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </>
  );
}
