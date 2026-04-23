import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "./authErrors";
import { authSchema, type AuthFormData } from "./authSchema";
import { signIn } from "./authService";

export function LoginForm() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({ resolver: zodResolver(authSchema) });

  async function onSubmit(data: AuthFormData) {
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setAuthError(getAuthErrorMessage(code));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        {errors.email && (
          <p role="alert" className="text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        {errors.password && (
          <p role="alert" className="text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {authError && (
        <p role="alert" className="text-sm text-red-600">
          {authError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
