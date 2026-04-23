import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { LoginPage } from "../LoginPage";
import * as useAuthStateModule from "../useAuthState";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock Firebase so LoginForm doesn't try to initialize a real app
vi.mock("../../../firebase/auth", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  // AC12
  it("already-authenticated user is redirected to /dashboard", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue(
      { uid: "abc123" } as User
    );
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("unauthenticated user sees the login form", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue(null);
    renderPage();
    expect(
      screen.getByRole("heading", { name: /entrar/i })
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders nothing while auth state is resolving", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue(undefined);
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
