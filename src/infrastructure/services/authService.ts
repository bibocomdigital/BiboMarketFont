import { apiErrorMessage, unwrapAuthSession, unwrapList, unwrapRecord } from "../api/api-envelope";
import { parseApiError } from "../api/fetch-error";
import { AppError } from "@domain/errors/app-error";

// Configuration de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007/api";

// URL de base Cloudinary pour les images
export const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/yourdomain"; // À remplacer par votre domaine Cloudinary

// Définition des rôles utilisateur
export enum UserRole { 
  CLIENT = 'CLIENT', 
  MERCHANT = 'MERCHANT', 
  SUPPLIER = 'SUPPLIER',
  ADMIN = 'ADMIN',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = { 
  [UserRole.CLIENT]: 'Client', 
  [UserRole.MERCHANT]: 'Commerçant', 
  [UserRole.SUPPLIER]: 'Fournisseur',
  [UserRole.ADMIN]: 'Administrateur',
};

// Interface pour les données utilisateur
export interface User { 
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  photo?: string;
  phoneNumber?: string;
  isVerified: boolean;
  phoneVerified?: boolean;
  googleId?: string | null;
  country?: string;
  city?: string;
  department?: string;
  commune?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface pour le contexte d'authentification
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AUTH_CHANGED_EVENT = "bibo-auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/**
 * Type pour les données de profil
 */
export interface ProfileData {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  photo?: File | string;
  city?: string;
  country?: string;
  bio?: string;
  birthdate?: string;
  role?: string;
  phoneVerified?: boolean;
  googleId?: string | null;
}

/**
 * Obtient l'URL complète d'une image stockée sur Cloudinary
 * @param photoPath Chemin partiel de l'image depuis l'API
 * @returns URL complète de l'image
 */
export const getPhotoUrl = (photoPath?: string): string => {
  if (!photoPath) return '';
  
  // Si l'URL est déjà complète (commence par http ou https), la retourner telle quelle
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // Si l'URL pointe vers Cloudinary
  if (photoPath.includes('cloudinary')) {
    // Si c'est une URL complète Cloudinary, la retourner telle quelle
    if (photoPath.startsWith('https://res.cloudinary.com')) {
      return photoPath;
    }
    
    // Si c'est un chemin partiel Cloudinary, construire l'URL complète
    return `${CLOUDINARY_BASE_URL}/${photoPath}`;
  }
  
  // Pour les anciennes images non-Cloudinary (pour compatibilité)
  return `${API_URL.replace('/api', '')}/uploads/${photoPath}`;
};

/**
 * Vérifie si un email existe déjà
 */
export const checkEmailExists = async (email: string): Promise<{ exists: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(apiErrorMessage(errorData, 'Erreur lors de la vérification de l\'email'));
    }

    const data = unwrapRecord(await response.json());
    return data as { exists: boolean };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    throw error;
  }
};

/**
 * Enregistre un nouvel utilisateur
 */
export const registerUser = async (formData: FormData): Promise<{
  message: string;
  email: string;
}> => {
  try {
    // S'assurer que tous les champs requis sont présents dans le FormData
    const requiredFields = ['phoneNumber', 'password', 'firstName', 'lastName', 'role'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        throw new Error(`Le champ ${field} est requis pour l'inscription`);
      }
    }

    // Vérifier si le mot de passe est défini et valide
    const password = formData.get('password');
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const payload = {
      password: String(formData.get("password") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
      role: String(formData.get("role") ?? "CLIENT"),
    };

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Vérifier si l'erreur est due à un email déjà existant
      if (errorData.message && errorData.message.includes('déjà utilisée')) {
        throw new Error('Cet email est déjà enregistré et vérifié.');
      }

      throw new Error(errorData.message || 'Erreur lors de l\'inscription');
    }

    const data = unwrapRecord(await response.json());
    const user = (data.user ?? {}) as { email?: string };
    return {
      message: String(data.message ?? 'Inscription réussie'),
      email: String(user.email ?? ''),
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
};

  /**
   * Vérifie si un email existe déjà (version simplifiée pour les composants)
   */
  export const handleCheckEmail = async (email: string, setEmailExists: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      return;
    }

    try {
      const result = await checkEmailExists(email);
      setEmailExists(result.exists);
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email :", error);
      setEmailExists(false);
    }
  };

  /**
   * Vérifie si un numéro de téléphone existe déjà
   */
  export const handleCheckPhone = async (phoneNumber: string, setPhoneExists: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setPhoneExists(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        setPhoneExists(false);
        return;
      }

      const data = unwrapRecord(await response.json());
      setPhoneExists(Boolean(data.exists));
    } catch (error) {
      console.error("Erreur lors de la vérification du téléphone :", error);
      setPhoneExists(false);
    }
  };

/**
 * Vérifie le code envoyé par email et finalise l'inscription
 */
export const verifyCode = async (email: string, verificationCode: string): Promise<{
  message: string;
  user: User;
}> => {
  try {
    console.log('🔄 [API] Début de la vérification du code');
    console.log('📧 [API] Email:', email);
    console.log('🔑 [API] Code de vérification:', verificationCode);
    console.log('📤 [API] URL de vérification:', `${API_URL}/auth/verify`);
    
    // Préparer le body de la requête
    const body = JSON.stringify({ email, verificationCode });
    console.log('📤 [API] Body de la requête de vérification:', body);
    
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    console.log('📊 [API] Statut de la réponse de vérification:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [API] Erreur de vérification du code:', errorData);
      
      // Déterminer le type d'erreur pour personnaliser le message
      if (errorData.message && errorData.message.includes('expiré')) {
        console.error('⏰ [API] Code de vérification expiré');
        throw new Error('Code de vérification expiré. Veuillez vous réinscrire.');
      } else if (errorData.message && errorData.message.includes('incorrect')) {
        console.error('❌ [API] Code de vérification incorrect');
        throw new Error('Code de vérification incorrect. Veuillez réessayer.');
      } else if (errorData.message && errorData.message.includes('non trouvé')) {
        console.error('🔍 [API] Utilisateur non trouvé');
        throw new Error('Utilisateur non trouvé. Veuillez vous inscrire.');
      }
      
      throw new Error(errorData.message || 'Erreur lors de la vérification du code');
    }

    const payload = unwrapRecord(await response.json());
    const user = payload.user as User;
    console.log('✅ [API] Vérification réussie:', payload);
    console.log('👤 [API] Utilisateur vérifié:', user?.email);
    console.log('👤 [API] Rôle de l\'utilisateur:', user?.role);
    
    return {
      message: String(payload.message ?? 'Vérification réussie'),
      user,
    };
  } catch (error) {
    console.error('❌ [API] Erreur lors de la vérification du code:', error);
    throw error;
  }
};

/**
 * Renvoie un code de vérification à l'utilisateur
 */
export const resendVerificationCode = async (email: string): Promise<{
  message: string;
}> => {
  try {
    console.log('🔄 [API] Demande de renvoi de code de vérification');
    console.log('📧 [API] Email:', email);
    console.log('📤 [API] URL de renvoi de code:', `${API_URL}/auth/resend-code`);
    
    const response = await fetch(`${API_URL}/auth/resend-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('📊 [API] Statut de la réponse de renvoi de code:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [API] Erreur de renvoi de code:', errorData);
      
      if (errorData.message && errorData.message.includes('non trouvé')) {
        console.error('🔍 [API] Utilisateur non trouvé');
        throw new Error('Utilisateur non trouvé. Veuillez vous inscrire.');
      } else if (errorData.message && errorData.message.includes('vérifié')) {
        console.error('✅ [API] Compte déjà vérifié');
        throw new Error('Ce compte est déjà vérifié.');
      }
      
      throw new Error(errorData.message || 'Erreur lors du renvoi du code');
    }

    const data = await response.json();
    console.log('✅ [API] Renvoi de code réussi:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur lors du renvoi du code:', error);
    throw error;
  }
};

/**
 * Connecte un utilisateur existant
 */
export const login = async (credentials: { email?: string; password: string, phoneNumber?: string }): Promise<{
  token: string;
  user: User;
}> => {
  try {
    console.log('🔄 [API] Tentative de connexion pour:', credentials.email);
    
    // Désactivation du mode simulation - toujours utiliser l'API réelle
    console.log('📤 [API] URL de connexion:', `${API_URL}/auth/login`);
    console.log('📤 [API] Données envoyées:', { email: credentials.email, password: '********', phoneNumber: credentials.phoneNumber });

    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📊 [API] Statut de la réponse de connexion:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [API] Erreur de connexion:', errorData);
      throw new Error(apiErrorMessage(errorData, 'Erreur lors de la connexion'));
    }

    const { token, user } = unwrapAuthSession<User>(await response.json());
    console.log('✅ [API] Connexion réussie pour:', user.email);
    console.log('👤 [API] Rôle de l\'utilisateur:', user.role);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    notifyAuthChanged();
    
    return { token, user };
  } catch (error) {
    console.error('❌ [API] Erreur lors de la connexion:', error);
    throw error;
  }
};

export const loginWithGoogle = async (
  idToken: string,
): Promise<{ token: string; user: User; needsCompletion: boolean }> => {
  const response = await fetch(`${API_URL}/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(apiErrorMessage(errorData, 'Erreur lors de la connexion Google'));
  }

  const raw = await response.json();
  const payload = unwrapRecord(raw);
  const { token, user } = unwrapAuthSession<User>(raw);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  notifyAuthChanged();

  return {
    token,
    user,
    needsCompletion: payload.needsCompletion === true,
  };
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): void => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      void fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => undefined);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    notifyAuthChanged();
  } catch (error) {
    console.error('❌ [API] Erreur lors de la déconnexion:', error);
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem('token');
    return !!token;
  } catch (error) {
    console.error('❌ [API] Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Récupère l'utilisateur connecté
 */
export const getCurrentUser = (): User | null => {
  try {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('❌ [API] Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

/**
 * Récupère l'utilisateur pour des raisons de compatibilité
 * @deprecated Utiliser getCurrentUser à la place
 */
export const getUser = (): User | null => {
  return getCurrentUser();
};

function asProfileUser(raw: Record<string, unknown>): ProfileData {
  const nested = raw.user;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as ProfileData;
  }
  return raw as ProfileData;
}

function persistProfileUser(user: ProfileData) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  localStorage.setItem("user", JSON.stringify({ ...currentUser, ...user }));
  notifyAuthChanged();
}

/**
 * Récupère le profil utilisateur détaillé
 */
export const getUserProfile = async (): Promise<ProfileData> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }

  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseApiError(response, "Erreur lors de la récupération du profil");
  }

  return asProfileUser(unwrapRecord(await response.json()));
};

/**
 * Met à jour le profil utilisateur
 */
export const updateUserProfile = async (profileData: ProfileData): Promise<ProfileData> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }

  const hasFile = profileData.photo instanceof File;
  let response: Response;

  if (hasFile) {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (key === "photo" && value instanceof File) {
        formData.append("photo", value);
        return;
      }
      formData.append(key, String(value));
    });
    response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } else {
    const { photo: _photo, id: _id, ...rest } = profileData;
    response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rest),
    });
  }

  if (!response.ok) {
    throw await parseApiError(response, "Erreur lors de la mise à jour du profil");
  }

  const user = asProfileUser(unwrapRecord(await response.json()));
  persistProfileUser(user);
  return user;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message?: string }> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible de changer le mot de passe");
  }

  const payload = unwrapRecord(await response.json());
  return { message: typeof payload.message === "string" ? payload.message : "Mot de passe mis à jour." };
};

export const requestPasswordReset = async (input: {
  email?: string;
  phoneNumber?: string;
}): Promise<{
  message?: string;
  status?: string;
  testResetCode?: string;
  email?: string;
  phoneNumber?: string;
}> => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Une erreur est survenue");
  }
  return data;
};

export const resetPassword = async (input: {
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}): Promise<{ message?: string }> => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      phone: input.phone,
      resetCode: input.code,
      newPassword: input.newPassword,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Une erreur est survenue");
  }
  return data;
};

function requireToken(): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }
  return token;
}

/**
 * Envoie un code de vérification SMS au numéro du compte connecté
 */
export const sendPhoneVerificationCode = async (): Promise<{
  message: string;
  phoneNumber?: string;
  expiresAt?: string;
  testCode?: string;
}> => {
  const response = await fetch(`${API_URL}/auth/phone/send-code`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible d'envoyer le code de vérification");
  }

  const payload = unwrapRecord(await response.json());
  return {
    message: typeof payload.message === "string" ? payload.message : "Code envoyé.",
    phoneNumber: typeof payload.phoneNumber === "string" ? payload.phoneNumber : undefined,
    expiresAt: typeof payload.expiresAt === "string" ? payload.expiresAt : undefined,
    testCode: typeof payload.testCode === "string" ? payload.testCode : undefined,
  };
};

/**
 * Vérifie le code SMS reçu pour le numéro du compte connecté
 */
export const verifyPhoneCode = async (code: string): Promise<{
  message: string;
  phoneVerified: boolean;
}> => {
  const response = await fetch(`${API_URL}/auth/phone/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw await parseApiError(response, "La vérification du numéro a échoué");
  }

  const payload = unwrapRecord(await response.json());

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  localStorage.setItem("user", JSON.stringify({ ...currentUser, phoneVerified: true }));
  notifyAuthChanged();

  return {
    message: typeof payload.message === "string" ? payload.message : "Numéro vérifié.",
    phoneVerified: true,
  };
};

export const getUserById = async (userId: string | number) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("La réponse n'est pas au format JSON");
  }
  const data = await response.json();
  return data.data || data;
};

export const getAdminUsers = async (): Promise<User[]> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("Non authentifié");
  }

  const response = await fetch(`${API_URL}/auth/all`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const raw = await response.json();
  if (!response.ok) {
    throw new Error(apiErrorMessage(raw, "Impossible de charger les utilisateurs"));
  }

  return unwrapList(raw, ["users"]) as User[];
};