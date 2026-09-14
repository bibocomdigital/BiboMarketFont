import User from "@domain/entities/user";

export type LoginCredentials = {
  email?: string;
  phoneNumber?: string;
  password: string;
};

export type AuthResult = {
  token: string;
  user: User;
};

interface AuthRepositoryInputPort {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(formData: FormData): Promise<{ message: string; email: string }>;
  verifyCode(email: string, verificationCode: string): Promise<{ message: string; user: User }>;
  getProfile(): Promise<User>;
  logout(): void;
}

export default AuthRepositoryInputPort;
