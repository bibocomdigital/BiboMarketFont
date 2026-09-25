import User from "@domain/entities/user";
import AuthRepositoryInputPort, {
  AuthResult,
  LoginCredentials,
} from "@application/port/input/auth.repo.port";
import Fetcher from "@/infrastructure/api/fetcher";
import {
  getCurrentUser,
  getUserProfile,
  login as loginService,
  logout as logoutService,
  registerUser,
  verifyCode as verifyCodeService,
  type User as ServiceUser,
} from "@/infrastructure/services/authService";

function toUser(user: ServiceUser): User {
  return new User(
    user.id,
    user.email,
    user.firstName,
    user.lastName,
    user.role,
    user.isVerified,
    user.photo,
    user.phoneNumber
  );
}

class AuthRepository implements AuthRepositoryInputPort {
  constructor(private readonly fetcher: Fetcher) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await loginService(credentials);
    if (!result.token || !result.user) {
      throw new Error("Code de double authentification requis");
    }
    return {
      token: result.token,
      user: toUser(result.user),
    };
  }

  async register(formData: FormData) {
    return registerUser(formData);
  }

  async verifyCode(email: string, verificationCode: string) {
    const result = await verifyCodeService(email, verificationCode);
    return {
      message: result.message,
      user: toUser(result.user),
    };
  }

  async getProfile() {
    const profile = await getUserProfile();
    const current = getCurrentUser();
    return new User(
      current?.id || 0,
      profile.email || current?.email || "",
      profile.firstName || current?.firstName || "",
      profile.lastName || current?.lastName || "",
      current?.role || "CLIENT",
      current?.isVerified || false,
      current?.photo,
      profile.phoneNumber || current?.phoneNumber
    );
  }

  logout() {
    logoutService();
  }
}

export default AuthRepository;
