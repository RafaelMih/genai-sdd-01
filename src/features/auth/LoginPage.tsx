import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { useAuthState } from "./useAuthState";

export function LoginPage() {
  const user = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Resolving auth state — render nothing to avoid flash of login form
  if (user === undefined) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
          Auth
        </p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">Entrar</h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
