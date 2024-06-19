import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { NDAEntity } from './nda.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionEntity } from './nda-version.entity';

@Injectable()
export class NDARepository extends BaseRepository<NDAEntity> {
  constructor(private dataSource: DataSource) {
    super(NDAEntity, dataSource);
  }

  async getLastNDA(user: UserEntity): Promise<NDAEntity | null> {
    return this.findOne({
      where: { user },
      order: { createdAt: 'DESC' },
    });
  }

  async findSignedNDAByUserAndVersion(
    user: UserEntity,
    ndaVersion: NDAVersionEntity,
  ): Promise<NDAEntity | null> {
    return this.findOne({
      where: { user, ndaVersion },
    });
  }
}
