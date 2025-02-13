import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { NDASignatureEntity } from './nda-signature.entity';

@Injectable()
export class NDARepository extends BaseRepository<NDASignatureEntity> {
  constructor(private dataSource: DataSource) {
    super(NDASignatureEntity, dataSource);
  }

  async findSignedNDAByUserAndVersion(
    userId: number,
    ndaVersionId: number,
  ): Promise<NDASignatureEntity | null> {
    return this.findOne({
      where: { userId, ndaVersionId },
    });
  }
}
