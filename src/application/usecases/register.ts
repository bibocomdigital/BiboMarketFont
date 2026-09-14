import AuthRepositoryInputPort from "@application/port/input/auth.repo.port";

class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepositoryInputPort) {}

  async register(formData: FormData) {
    return this.authRepository.register(formData);
  }
}

export default RegisterUseCase;
