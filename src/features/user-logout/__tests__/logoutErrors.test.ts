import { describe, expect, it } from "vitest";
import { getLogoutErrorMessage } from "../logoutErrors";

describe("getLogoutErrorMessage", () => {
  // AC5
  it("auth/network-request-failed returns Erro de conexão. Tente novamente.", () => {
    expect(getLogoutErrorMessage("auth/network-request-failed")).toBe(
      "Erro de conexão. Tente novamente.",
    );
  });

  it("unknown code returns Erro ao sair da conta.", () => {
    expect(getLogoutErrorMessage("auth/unknown")).toBe("Erro ao sair da conta.");
  });

  it("empty code returns Erro ao sair da conta.", () => {
    expect(getLogoutErrorMessage("")).toBe("Erro ao sair da conta.");
  });
});
