"use client";

import LoginUseCase from "@application/usecases/login";
import LogoutUseCase from "@application/usecases/logout";
import RegisterUseCase from "@application/usecases/register";
import AuthRepository from "@infrastructure/repositories/auth.repo";
import { getClientFetcher } from "@infrastructure/di/client-http";

interface ClientAuth {
  loginUseCase: LoginUseCase;
  registerUseCase: RegisterUseCase;
  logoutUseCase: LogoutUseCase;
}

let clientAuth: ClientAuth | null = null;

export function getClientAuth(): ClientAuth {
  if (!clientAuth) {
    const authRepository = new AuthRepository(getClientFetcher());
    clientAuth = {
      loginUseCase: new LoginUseCase(authRepository),
      registerUseCase: new RegisterUseCase(authRepository),
      logoutUseCase: new LogoutUseCase(authRepository),
    };
  }

  return clientAuth;
}
