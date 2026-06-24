import CheckOutputPort from "@/application/port/output/check.port";
import CheckTestRepositoryInputPort from "../port/input/check-test.repo.port";
import Check from "@/domain/entities/check";

class CheckTestUseCase implements CheckOutputPort {
  constructor(private readonly checkRepository: CheckTestRepositoryInputPort) {}

  async check(): Promise<Check> {
    return this.checkRepository.check();
  }
}

export default CheckTestUseCase;