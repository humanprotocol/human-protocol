import { Injectable, Logger } from '@nestjs/common';
import { DataSource, IsNull, LessThanOrEqual, Not } from 'typeorm';

import { ServerConfigService } from '../../common/config/server-config.service';
import { BaseRepository } from '../../database/base.repository';
import { AbuseEntity } from './abuse.entity';
import { ChainId } from '@human-protocol/sdk';
import { AbuseStatus } from '../../common/enums/abuse';

@Injectable()
export class AbuseRepository extends BaseRepository<AbuseEntity> {
  private readonly logger = new Logger(AbuseRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(AbuseEntity, dataSource);
  }

  public async findOneByChainIdAndEscrowAddress(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<AbuseEntity | null> {
    return this.findOne({
      where: {
        chainId,
        escrowAddress,
      },
    });
  }

  public findByStatus(status: AbuseStatus): Promise<AbuseEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  public findClassified(): Promise<AbuseEntity[]> {
    return this.find({
      where: {
        status: AbuseStatus.NOTIFIED,
        decision: Not(IsNull()),
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
