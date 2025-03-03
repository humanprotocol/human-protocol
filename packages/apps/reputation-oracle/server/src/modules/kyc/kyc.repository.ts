import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { KycEntity } from './kyc.entity';

@Injectable()
export class KycRepository extends BaseRepository<KycEntity> {
  constructor(private dataSource: DataSource) {
    super(KycEntity, dataSource);
  }

  public async findOneBySessionId(
    sessionId: string,
  ): Promise<KycEntity | null> {
    const userEntity = await this.findOne({
      where: {
        sessionId: sessionId,
      },
    });

    return userEntity;
  }
}
