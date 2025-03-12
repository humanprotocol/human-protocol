import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { SiteKeyEntity } from './site-key.entity';
import { SiteKeyType } from '../../common/enums';

@Injectable()
export class SiteKeyRepository extends BaseRepository<SiteKeyEntity> {
  constructor(dataSource: DataSource) {
    super(SiteKeyEntity, dataSource);
  }

  async findByUserSiteKeyAndType(
    userId: number,
    siteKey: string,
    type: SiteKeyType,
  ): Promise<SiteKeyEntity | null> {
    return this.findOne({
      where: { userId, siteKey, type },
    });
  }

  async findByUserAndType(
    userId: number,
    type: SiteKeyType,
  ): Promise<SiteKeyEntity[]> {
    return this.find({ where: { userId, type } });
  }
}
