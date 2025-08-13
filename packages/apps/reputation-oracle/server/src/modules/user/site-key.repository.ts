import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

import { SiteKeyEntity, SiteKeyType } from './site-key.entity';

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
    if (!userId || !siteKey || !type) {
      throw new Error('Invalid arguments');
    }
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
