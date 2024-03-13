import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { JobEntity } from './job.entity';

@Injectable()
export class JobRepository extends BaseRepository<JobEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(JobEntity, dataSource);
  }

  public async findOneById(id: number): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        id,
      },
    });
  }

  public async findOneByChainIdAndEscrowAddress(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        chainId,
        escrowAddress,
      },
    });
  }
}
