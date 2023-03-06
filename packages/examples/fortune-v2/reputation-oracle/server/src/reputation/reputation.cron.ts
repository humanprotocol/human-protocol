import { Injectable, Logger } from "@nestjs/common";
import { ReputationService } from "./reputation.service";

@Injectable()
export class ReputationCron {
  private readonly logger = new Logger(ReputationCron.name);

  constructor(private readonly reputationService: ReputationService) {}
}
