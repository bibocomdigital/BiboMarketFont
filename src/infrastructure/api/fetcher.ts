import { AxiosInstance, AxiosRequestConfig } from "axios";
import Axios from "./axios";

class Fetcher {
  private axios: AxiosInstance;

  constructor() {
    this.axios = new Axios().getAxiosInstance();
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get(url, config);
    return response.data;
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post(url, data, config);
    return response.data;
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put(url, data, config);
    return response.data;
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete(url, config);
    return response.data;
  }

  public async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.patch(url, data, config);
    return response.data;
  }

  public async options<T = unknown>(url: string): Promise<T> {
    const response = await this.axios.options(url);
    return response.data;
  }

  public async head(url: string) {
    const response = await this.axios.head(url);
    return response.data;
  }
}

export default Fetcher;
