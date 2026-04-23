import { describe, expect, it } from "vitest";
import { authSchema } from "../authSchema";

describe("authSchema", () => {
  // AC1
  it("empty email shows E-mail é obrigatório", () => {
    const result = authSchema.safeParse({ email: "", password: "valid123" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("E-mail é obrigatório");
  });

  // AC2
  it("malformed email shows E-mail inválido", () => {
    const result = authSchema.safeParse({
      email: "notanemail",
      password: "valid123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("E-mail inválido");
  });

  // AC3
  it("empty password shows Senha é obrigatória", () => {
    const result = authSchema.safeParse({ email: "test@test.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Senha é obrigatória");
  });

  // AC4
  it("password shorter than 6 chars shows length error", () => {
    const result = authSchema.safeParse({
      email: "test@test.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "A senha deve ter pelo menos 6 caracteres"
    );
  });

  it("valid data passes validation", () => {
    const result = authSchema.safeParse({
      email: "test@test.com",
      password: "valid123",
    });
    expect(result.success).toBe(true);
  });
});
