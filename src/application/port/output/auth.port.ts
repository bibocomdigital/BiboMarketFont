import User from "@domain/entities/user";
import type { AuthResult, LoginCredentials } from "../input/auth.repo.port";

interface AuthOutputPort {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(formData: FormData): Promise<{ message: string; email: string }>;
  verifyCode(email: string, verificationCode: string): Promise<{ message: string; user: User }>;
  logout(): void;
}

export default AuthOutputPort;
