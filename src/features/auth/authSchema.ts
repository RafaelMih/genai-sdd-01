import { z } from "zod";

export const authSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type AuthFormData = z.infer<typeof authSchema>;
