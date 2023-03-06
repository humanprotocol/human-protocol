import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { ReputationOracleEntity } from "./reputation-oracle.entity";
import { ReputationWorkerEntity } from "./reputation-worker.entity";
import { Repository } from "typeorm";

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(ReputationOracleEntity)
    private readonly ReputationOracleEntityRepository: Repository<ReputationOracleEntity>,
    @InjectRepository(ReputationWorkerEntity)
    private readonly ReputationWorkerEntityRepository: Repository<ReputationWorkerEntity>,
    private readonly configService: ConfigService,
  ) {}
}
