import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Veuillez saisir votre nom complet." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  phone: z.string().optional(),
  subject: z.string().min(3, { message: "Veuillez indiquer le sujet de votre message." }),
  message: z.string().min(10, { message: "Votre message doit contenir au moins 10 caractères." }),
  type: z.string().min(1, { message: "Veuillez sélectionner un type de demande." }),
});

export const newsletterSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
});

export const verifyCodeSchema = z.object({
  code: z.string().length(6, { message: "Le code de vérification doit contenir 6 caractères." }),
});
