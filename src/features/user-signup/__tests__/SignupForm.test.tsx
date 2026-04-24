import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as signupService from "../signupService";
import { SignupForm } from "../SignupForm";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../firebase/auth", () => ({ auth: {} }));
vi.mock("../../../firebase/firestore", () => ({ db: {} }));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

function renderForm() {
  render(
    <MemoryRouter>
      <SignupForm />
    </MemoryRouter>
  );
}

function fillForm(name: string, email: string, password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: confirm } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));
}

describe("SignupForm — Firebase error messages", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  // AC10
  it("email-already-in-use shows Este e-mail já está em uso.", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/email-already-in-use" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Este e-mail já está em uso.")
    );
  });

  // AC11
  it("network-request-failed shows Erro de conexão.", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/network-request-failed" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro de conexão.")
    );
  });

  // AC12
  it("too-many-requests shows Muitas tentativas.", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/too-many-requests" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas.")
    );
  });

  // AC13
  it("operation-not-allowed shows Operação não permitida.", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/operation-not-allowed" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Operação não permitida.")
    );
  });

  // AC14
  it("unknown error shows Erro ao criar conta.", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/unknown" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro ao criar conta.")
    );
  });

  // AC15 entry — button disabled with label Criando conta… during request
  it("submit button disabled and shows Criando conta… while request is in progress", async () => {
    let resolveCreate!: (value: void) => void;
    vi.spyOn(signupService, "createAccount").mockReturnValueOnce(
      new Promise<void>((r) => { resolveCreate = r; })
    );
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /criando conta/i })).toBeDisabled()
    );

    await act(async () => { resolveCreate(); });
  });

  // AC15 exit — button re-enabled with label Criar conta after error
  it("submit button re-enabled with label Criar conta after Firebase error", async () => {
    vi.spyOn(signupService, "createAccount").mockRejectedValueOnce({ code: "auth/email-already-in-use" });
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^criar conta$/i })).not.toBeDisabled()
    );
  });

  // AC16 — successful signup navigates to /dashboard with replace
  it("successful signup navigates to /dashboard with replace", async () => {
    vi.spyOn(signupService, "createAccount").mockResolvedValueOnce();
    renderForm();
    fillForm("João Silva", "joao@test.com", "pass123", "pass123");
    submit();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    );
  });
});
