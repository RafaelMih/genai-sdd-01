import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserCredential } from "firebase/auth";
import * as authService from "../authService";
import { LoginForm } from "../LoginForm";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Prevent Firebase from initializing with missing env credentials in test env
vi.mock("../../../firebase/auth", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

function renderForm() {
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/senha/i), {
    target: { value: password },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("LoginForm — Firebase error messages", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  // AC5 — wrong-password
  it("wrong-password shows E-mail ou senha incorretos", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/wrong-password",
    });
    renderForm();
    fillForm("user@test.com", "wrongpass");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "E-mail ou senha incorretos."
      )
    );
  });

  // AC5 — user-not-found
  it("user-not-found shows E-mail ou senha incorretos", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/user-not-found",
    });
    renderForm();
    fillForm("unknown@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "E-mail ou senha incorretos."
      )
    );
  });

  // AC5 — invalid-credential
  it("invalid-credential shows E-mail ou senha incorretos", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "E-mail ou senha incorretos."
      )
    );
  });

  // AC6
  it("disabled account shows conta desativada message", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/user-disabled",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Esta conta foi desativada."
      )
    );
  });

  // AC7
  it("too many requests shows rate limit message", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/too-many-requests",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas.")
    );
  });

  // AC8
  it("network error shows connection message", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/network-request-failed",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Falha na conexão.")
    );
  });

  // AC9
  it("unknown Firebase error shows generic message", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/unknown-error",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ocorreu um erro inesperado."
      )
    );
  });

  // auth/invalid-email fallback (client-side bypass via DevTools)
  it("auth/invalid-email fallback shows E-mail inválido", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/invalid-email",
    });
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("E-mail inválido")
    );
  });

  // AC10 — redirect uses replace semantics
  it("successful login navigates to /dashboard with replace", async () => {
    vi.spyOn(authService, "signIn").mockResolvedValueOnce(
      {} as UserCredential
    );
    renderForm();
    fillForm("user@test.com", "password123");
    submit();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    );
  });

  // AC11 entry — button disabled and shows loading label during request
  it("submit button disabled and shows loading text while request is in progress", async () => {
    let resolveSignIn!: (value: UserCredential) => void;
    vi.spyOn(authService, "signIn").mockReturnValueOnce(
      new Promise<UserCredential>((r) => {
        resolveSignIn = r;
      })
    );
    renderForm();
    fillForm("user@test.com", "password123");
    submit();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled()
    );

    await act(async () => {
      resolveSignIn({} as UserCredential);
    });
  });

  // AC11 exit — button re-enabled with original label after Firebase error
  it("submit button re-enabled with label Entrar after Firebase error", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValueOnce({
      code: "auth/wrong-password",
    });
    renderForm();
    fillForm("user@test.com", "wrongpass");
    submit();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^entrar$/i })).not.toBeDisabled()
    );
  });
});
