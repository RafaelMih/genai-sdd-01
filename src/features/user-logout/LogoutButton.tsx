import { signOut } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/auth";
import { e2eSignOut } from "../auth/e2eAuth";
import { getLogoutErrorMessage } from "./logoutErrors";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

export function LogoutButton() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsSubmitting(true);
    setError(null);
    try {
      if (isE2EMode) {
        await e2eSignOut();
      } else {
        await signOut(auth);
      }

      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getLogoutErrorMessage(code));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleLogout}
        disabled={isSubmitting}
        data-testid="logout-button"
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saindo..." : "Sair"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
