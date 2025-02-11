import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { NDASignatureEntity } from './nda-signature.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionEntity } from './nda-version.entity';

@Injectable()
export class NDARepository extends BaseRepository<NDASignatureEntity> {
  constructor(private dataSource: DataSource) {
    super(NDASignatureEntity, dataSource);
  }

  async findSignedNDAByUserAndVersion(
    user: UserEntity,
    ndaVersion: NDAVersionEntity,
  ): Promise<NDASignatureEntity | null> {
    return this.findOne({
      where: { user, ndaVersion },
    });
  }
}
