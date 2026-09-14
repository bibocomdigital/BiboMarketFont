import AuthOutputPort from "@application/port/output/auth.port";
import AuthRepositoryInputPort, {
  AuthResult,
  LoginCredentials,
} from "@application/port/input/auth.repo.port";

class LoginUseCase implements Pick<AuthOutputPort, "login"> {
  constructor(private readonly authRepository: AuthRepositoryInputPort) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    return this.authRepository.login(credentials);
  }
}

export default LoginUseCase;
