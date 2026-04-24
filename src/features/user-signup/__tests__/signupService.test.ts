import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserCredential } from "firebase/auth";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import { createAccount } from "../signupService";

vi.mock("../../../firebase/auth", () => ({ auth: {} }));
vi.mock("../../../firebase/firestore", () => ({ db: {} }));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn().mockReturnValue("doc-ref"),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
}));

describe("createAccount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(firebaseFirestore.doc).mockReturnValue("doc-ref" as any);
    vi.mocked(firebaseFirestore.serverTimestamp).mockReturnValue("SERVER_TIMESTAMP" as any);
  });

  // AC17 — Firestore document created with correct fields
  it("creates Firestore document at users/{uid} with correct fields after auth success", async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid-123" },
    } as UserCredential);
    vi.mocked(firebaseFirestore.setDoc).mockResolvedValueOnce(undefined);

    await createAccount("João Silva", "joao@test.com", "pass123");

    expect(firebaseFirestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "test-uid-123");
    expect(firebaseFirestore.setDoc).toHaveBeenCalledWith("doc-ref", {
      displayName: "João Silva",
      email: "joao@test.com",
      provider: "password",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    });
  });

  // AC21 — phone present → Firestore document includes phone field
  it("creates Firestore document with phone field when phone is provided", async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid-123" },
    } as UserCredential);
    vi.mocked(firebaseFirestore.setDoc).mockResolvedValueOnce(undefined);

    await createAccount("João Silva", "joao@test.com", "pass123", "+12345678");

    expect(firebaseFirestore.setDoc).toHaveBeenCalledWith("doc-ref", {
      displayName: "João Silva",
      email: "joao@test.com",
      provider: "password",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
      phone: "+12345678",
    });
  });

  // AC21 — phone absent → Firestore document omits phone field
  it("creates Firestore document without phone field when phone is empty string", async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid-123" },
    } as UserCredential);
    vi.mocked(firebaseFirestore.setDoc).mockResolvedValueOnce(undefined);

    await createAccount("João Silva", "joao@test.com", "pass123", "");

    expect(firebaseFirestore.setDoc).toHaveBeenCalledWith("doc-ref", {
      displayName: "João Silva",
      email: "joao@test.com",
      provider: "password",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    });
  });

  // Partial failure contract — signOut called when Firestore write fails
  it("calls signOut and rethrows when Firestore write fails after auth success", async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid-123" },
    } as UserCredential);
    vi.mocked(firebaseFirestore.setDoc).mockRejectedValueOnce({ code: "permission-denied" });
    vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined);

    await expect(createAccount("João Silva", "joao@test.com", "pass123")).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });
});
