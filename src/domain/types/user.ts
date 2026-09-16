
/**
 * User role enumeration
 */
export enum UserRole {
  CLIENT = "CLIENT",
  MERCHANT = "MERCHANT",
  SUPPLIER = "SUPPLIER",
  ADMIN = "ADMIN",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Client",
  [UserRole.MERCHANT]: "Commerçant",
  [UserRole.SUPPLIER]: "Fournisseur",
  [UserRole.ADMIN]: "Administrateur",
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
    default:
      return UserRole.CLIENT;
  }
};
