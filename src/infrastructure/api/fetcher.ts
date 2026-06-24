import { AxiosInstance } from "axios";
import Axios from "./axios";

class Fetcher {
    private axios: AxiosInstance;

    constructor() {
        this.axios = new Axios().getAxiosInstance();
    }

    public async get(url: string) {
        console.log(url);
        const response = await this.axios.get(url);

        return response.data;
    }

    public async post(url: string, data: unknown) {
        const response = await this.axios.post(url, data);
        return response.data;
    }

    public async put(url: string, data: unknown) {
        const response = await this.axios.put(url, data);
        return response.data;
    }

    public async delete(url: string) {
        const response = await this.axios.delete(url);
        return response.data;
    }

    public async patch(url: string, data: unknown) {
        const response = await this.axios.patch(url, data);
        return response.data;
    }

    public async options(url: string) {
        const response = await this.axios.options(url);
        return response.data;
    }

    public async head(url: string) {
        const response = await this.axios.head(url);
        return response.data;
    }
}

export default Fetcher;