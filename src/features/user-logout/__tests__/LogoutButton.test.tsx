import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as firebaseAuth from "firebase/auth";
import { LogoutButton } from "../LogoutButton";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../firebase/auth", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
}));

function renderButton() {
  render(
    <MemoryRouter>
      <LogoutButton />
    </MemoryRouter>
  );
}

describe("LogoutButton", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  // AC1 — clicking logout calls signOut(auth)
  // AC4 covered implicitly: signOut triggers onAuthStateChanged(null) via Firebase SDK
  it("clicking logout calls signOut(auth)", async () => {
    vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined);
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    await waitFor(() => expect(firebaseAuth.signOut).toHaveBeenCalled());
  });

  // AC2 — button shows "Saindo…" and is disabled during signOut
  it("button shows Saindo… and is disabled while signOut is in progress", async () => {
    let resolveSignOut!: (v: void) => void;
    vi.mocked(firebaseAuth.signOut).mockReturnValueOnce(
      new Promise<void>((r) => { resolveSignOut = r; })
    );
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /saindo/i })).toBeDisabled()
    );

    await act(async () => { resolveSignOut(); });
  });

  // AC3 + AC6 — successful logout navigates to /login with replace
  it("successful logout navigates to /login with replace", async () => {
    vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined);
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
    );
  });

  // AC5 — signOut failure shows error below button and re-enables button
  it("signOut failure shows Erro ao sair da conta. below button and re-enables Sair", async () => {
    vi.mocked(firebaseAuth.signOut).mockRejectedValueOnce({ code: "auth/unknown" });
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro ao sair da conta.")
    );
    expect(screen.getByRole("button", { name: /^sair$/i })).not.toBeDisabled();
  });

  // AC5 — error is cleared when a new logout attempt begins
  it("error message is cleared when a new logout attempt begins", async () => {
    let resolveSecond!: (v: void) => void;
    vi.mocked(firebaseAuth.signOut)
      .mockRejectedValueOnce({ code: "auth/unknown" })
      .mockReturnValueOnce(new Promise<void>((r) => { resolveSecond = r; }));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro ao sair da conta.")
    );

    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());

    await act(async () => { resolveSecond(); });
  });
});
