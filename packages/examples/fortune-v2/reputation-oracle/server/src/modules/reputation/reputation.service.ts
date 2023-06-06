import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Repository } from "typeorm";
import { ReputationRepository } from "./reputation.repository";

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly reputationRepository: ReputationRepository,
    private readonly configService: ConfigService,
  ) {}
}
