import axios, { AxiosInstance } from "axios";

class Axios {
    private axios: AxiosInstance;

    constructor() {
        this.axios = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
        });
    }

    public getAxiosInstance(): AxiosInstance {
        return this.axios;
    }
}

export default Axios;