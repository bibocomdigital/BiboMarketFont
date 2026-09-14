
import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z.string({ message: 'Veuillez entrer une adresse email valide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
  rememberMe: z.boolean().default(true),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
