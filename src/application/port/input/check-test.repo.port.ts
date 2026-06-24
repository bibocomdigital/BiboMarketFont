import Check from "@/domain/entities/check";

interface CheckTestRepositoryInputPort {
    check(): Promise<Check>;
}

export default CheckTestRepositoryInputPort;