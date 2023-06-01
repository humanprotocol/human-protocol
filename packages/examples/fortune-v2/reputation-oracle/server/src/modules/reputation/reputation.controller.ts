import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ReputationService } from "./reputation.service";

@ApiBearerAuth()
@ApiTags("Reputation")
@Controller("/reputation")
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}
}
