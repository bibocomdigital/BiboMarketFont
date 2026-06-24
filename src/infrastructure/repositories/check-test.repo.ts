import Fetcher from "@/infrastructure/api/fetcher";
import CheckTestRepositoryInputPort from "@application/port/input/check-test.repo.port";
import Check from "@domain/entities/check";

class CheckTestRepository implements CheckTestRepositoryInputPort {
    constructor(private readonly fetcher: Fetcher) {}
    async check(): Promise<Check> {
        const response = await this.fetcher.get("/api/health");
        return new Check(response.data.message);
    }
}

export default CheckTestRepository;
