import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { SignupPage } from "../SignupPage";
import * as useAuthStateModule from "../../auth/useAuthState";

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
  onAuthStateChanged: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

describe("SignupPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  // AC18
  it("already-authenticated user is redirected to /dashboard without rendering the form", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue({ uid: "abc123" } as User);
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    expect(screen.queryByRole("heading", { name: /criar conta/i })).toBeNull();
  });

  it("unauthenticated user sees the signup form", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue(null);
    renderPage();
    expect(screen.getByRole("heading", { name: /criar conta/i })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders nothing while auth state is resolving", () => {
    vi.spyOn(useAuthStateModule, "useAuthState").mockReturnValue(undefined);
    const { container } = render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
