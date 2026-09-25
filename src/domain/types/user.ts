
/**
 * User role enumeration
 */
export enum UserRole {
  CLIENT = "CLIENT",
  MERCHANT = "MERCHANT",
  SUPPLIER = "SUPPLIER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Client",
  [UserRole.MERCHANT]: "Commerçant",
  [UserRole.SUPPLIER]: "Fournisseur",
  [UserRole.MODERATOR]: "Modérateur",
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.SUPER_ADMIN]: "Super administrateur",
};

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
    case 'ADMIN':
    case 'ADMINISTRATEUR':
      return UserRole.ADMIN;
    case 'SUPER_ADMIN':
      return UserRole.SUPER_ADMIN;
    case 'MODERATOR':
    case 'MODERATEUR':
      return UserRole.MODERATOR;
    default:
      return UserRole.CLIENT;
  }
};
