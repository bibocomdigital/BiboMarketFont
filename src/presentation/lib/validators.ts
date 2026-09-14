import { z } from 'zod';
import { UserRole } from '@/services/authService';

export class Validators {
  // Schéma de validation pour le formulaire d'inscription
  static registerFormSchema = z.object({
    email: z.string().email({ message: 'Veuillez entrer une adresse email valide' }),
    firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
    lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
    phoneNumber: z.string().min(9, { message: 'Numéro de téléphone invalide' }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
    confirmPassword: z.string().min(1, { message: 'Veuillez confirmer votre mot de passe' }),
    country: z.string().min(2, { message: 'Veuillez entrer un pays valide' }),
    city: z.string().min(2, { message: 'Veuillez entrer une ville valide' }),
    department: z.string().min(2, { message: 'Veuillez entrer un département valide' }),
    commune: z.string().min(2, { message: 'Veuillez entrer une commune valide' }),
    photo: z.any().optional(),
    role: z.nativeEnum(UserRole, {
      required_error: 'Veuillez sélectionner un rôle',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

  // Schéma de validation pour le formulaire de connexion
  static loginFormSchema = z.object({
    email: z.string().email({ message: 'Veuillez entrer une adresse email valide' }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
    rememberMe: z.boolean().default(true),
  });

  // Fonctions de validation individuelles pour l'inscription
  static validateEmail(email: string): string | null {
    try {
      z.string().email({ message: 'Veuillez entrer une adresse email valide' }).parse(email);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateFirstName(firstName: string): string | null {
    try {
      z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }).parse(firstName);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateLastName(lastName: string): string | null {
    try {
      z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }).parse(lastName);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validatePhoneNumber(phoneNumber: string): string | null {
    try {
      z.string().min(9, { message: 'Numéro de téléphone invalide' }).parse(phoneNumber);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validatePassword(password: string): string | null {
    try {
      z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }).parse(password);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateConfirmPassword(confirmPassword: string): string | null {
    try {
      z.string().min(1, { message: 'Veuillez confirmer votre mot de passe' }).parse(confirmPassword);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateCountry(country: string): string | null {
    try {
      z.string().min(2, { message: 'Veuillez entrer un pays valide' }).parse(country);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateCity(city: string): string | null {
    try {
      z.string().min(2, { message: 'Veuillez entrer une ville valide' }).parse(city);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateDepartment(department: string): string | null {
    try {
      z.string().min(2, { message: 'Veuillez entrer un département valide' }).parse(department);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateCommune(commune: string): string | null {
    try {
      z.string().min(2, { message: 'Veuillez entrer une commune valide' }).parse(commune);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  static validateRole(role: UserRole): string | null {
    try {
      z.nativeEnum(UserRole, { required_error: 'Veuillez sélectionner un rôle' }).parse(role);
      return null;
    } catch (error: any) {
      return error.errors[0].message;
    }
  }

  // Fonctions de validation individuelles pour la connexion
  static validateLoginEmail(email: string): string | null {
    return this.validateEmail(email);
  }

  static validateLoginPassword(password: string): string | null {
    return this.validatePassword(password);
  }

  // Fonction pour valider la correspondance des mots de passe
  static validatePasswordMatch(password: string, confirmPassword: string): string | null {
    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas";
    }
    return null;
  }
}
