import AuthRepositoryInputPort from "@application/port/input/auth.repo.port";

class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepositoryInputPort) {}

  logout() {
    this.authRepository.logout();
  }
}

export default LogoutUseCase;
