import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

import { KycEntity } from './kyc.entity';

@Injectable()
export class KycRepository extends BaseRepository<KycEntity> {
  constructor(dataSource: DataSource) {
    super(KycEntity, dataSource);
  }

  async findOneByUserId(userId: number): Promise<KycEntity | null> {
    const kycEntity = await this.findOne({ where: { userId } });

    return kycEntity;
  }

  async findOneBySessionId(sessionId: string): Promise<KycEntity | null> {
    const kycEntity = await this.findOne({
      where: {
        sessionId,
      },
    });

    return kycEntity;
  }
}
