import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "O nome deve ter pelo menos 2 caracteres")
      .max(100, "O nome deve ter no máximo 100 caracteres"),
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido"),
    password: z
      .string()
      .min(1, "Senha é obrigatória")
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    phone: z
      .string()
      .refine(
        (val) => !val || /^\+?[\d\s()-]{8,20}$/.test(val),
        "Telefone inválido",
      )
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
