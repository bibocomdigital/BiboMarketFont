import axios, { AxiosInstance } from "axios";
import { toAppError } from "@domain/errors/app-error";

class Axios {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3007/api",
      timeout: 15_000,
    });

    this.axios.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        throw toAppError(error?.response?.status, error);
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}

export default Axios;
