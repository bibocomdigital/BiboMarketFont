export type UserRoleValue = "CLIENT" | "MERCHANT" | "SUPPLIER" | "ADMIN";

class User {
  constructor(
    private readonly id: number,
    private readonly email: string,
    private readonly firstName: string,
    private readonly lastName: string,
    private readonly role: UserRoleValue,
    private readonly isVerified: boolean,
    private readonly photo?: string,
    private readonly phoneNumber?: string
  ) {}

  public getId() {
    return this.id;
  }

  public getEmail() {
    return this.email;
  }

  public getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public getRole() {
    return this.role;
  }

  public getIsVerified() {
    return this.isVerified;
  }

  public getPhoto() {
    return this.photo;
  }

  public getPhoneNumber() {
    return this.phoneNumber;
  }
}

export default User;
