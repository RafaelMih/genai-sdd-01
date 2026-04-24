import { describe, expect, it } from "vitest";
import { signupSchema } from "../signupSchema";

describe("signupSchema", () => {
  // AC1
  it("empty name shows Nome é obrigatório", () => {
    const result = signupSchema.safeParse({
      name: "",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Nome é obrigatório");
  });

  // AC2
  it("name shorter than 2 chars shows O nome deve ter pelo menos 2 caracteres", () => {
    const result = signupSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("O nome deve ter pelo menos 2 caracteres");
  });

  // AC3
  it("name longer than 100 chars shows O nome deve ter no máximo 100 caracteres", () => {
    const result = signupSchema.safeParse({
      name: "A".repeat(101),
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("O nome deve ter no máximo 100 caracteres");
  });

  // AC4
  it("empty email shows E-mail é obrigatório", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(false);
    const emailIssue = result.error?.issues.find((i) => i.path[0] === "email");
    expect(emailIssue?.message).toBe("E-mail é obrigatório");
  });

  // AC5
  it("malformed email shows E-mail inválido", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "notanemail",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(false);
    const emailIssue = result.error?.issues.find((i) => i.path[0] === "email");
    expect(emailIssue?.message).toBe("E-mail inválido");
  });

  // AC6
  it("empty password shows Senha é obrigatória", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "a@b.com",
      password: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    const passIssue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(passIssue?.message).toBe("Senha é obrigatória");
  });

  // AC7
  it("password shorter than 6 chars shows length error", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "a@b.com",
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
    const passIssue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(passIssue?.message).toBe("A senha deve ter pelo menos 6 caracteres");
  });

  // AC8
  it("empty confirmPassword shows Confirmação de senha é obrigatória", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    const confirmIssue = result.error?.issues.find((i) => i.path[0] === "confirmPassword");
    expect(confirmIssue?.message).toBe("Confirmação de senha é obrigatória");
  });

  // AC9
  it("mismatched confirmPassword shows As senhas não conferem", () => {
    const result = signupSchema.safeParse({
      name: "João",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "other456",
    });
    expect(result.success).toBe(false);
    const confirmIssue = result.error?.issues.find((i) => i.path[0] === "confirmPassword");
    expect(confirmIssue?.message).toBe("As senhas não conferem");
  });

  // AC19 — empty phone passes silently
  it("empty phone string passes validation with no error", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("absent phone passes validation with no error", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(true);
  });

  // AC20 — invalid phone format
  it("phone with 7 characters shows Telefone inválido", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
      phone: "1234567",
    });
    expect(result.success).toBe(false);
    const phoneIssue = result.error?.issues.find((i) => i.path[0] === "phone");
    expect(phoneIssue?.message).toBe("Telefone inválido");
  });

  it("phone with plus and only 7 digits shows Telefone inválido", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
      phone: "+1234567",
    });
    expect(result.success).toBe(false);
    const phoneIssue = result.error?.issues.find((i) => i.path[0] === "phone");
    expect(phoneIssue?.message).toBe("Telefone inválido");
  });

  it("valid phone passes validation", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "a@b.com",
      password: "pass123",
      confirmPassword: "pass123",
      phone: "+12345678",
    });
    expect(result.success).toBe(true);
  });

  it("valid data passes validation", () => {
    const result = signupSchema.safeParse({
      name: "João Silva",
      email: "joao@test.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    expect(result.success).toBe(true);
  });
});
