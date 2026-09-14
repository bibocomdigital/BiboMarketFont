
/**
 * User role enumeration
 */
export enum UserRole {
  CLIENT = "CLIENT",
  MERCHANT = "MERCHANT",
  SUPPLIER = "SUPPLIER"
}

/**
 * User role display names
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Client",
  [UserRole.MERCHANT]: "Commerçant",
  [UserRole.SUPPLIER]: "Fournisseur"
};

/**
 * Mapping des rôles de chaîne aux valeurs UserRole
 */
export const mapStringToUserRole = (role: string): UserRole => {
  switch (role.toUpperCase()) {
    case 'CLIENT':
      return UserRole.CLIENT;
    case 'MERCHANT':
    case 'COMMERCANT':
      return UserRole.MERCHANT;
    case 'SUPPLIER':
    case 'FOURNISSEUR':
      return UserRole.SUPPLIER;
    default:
      return UserRole.CLIENT; // Valeur par défaut
  }
};
