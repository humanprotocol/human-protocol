import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { SiteKeyEntity } from './site-key.entity';
import { SiteKeyType } from '../../common/enums';
import { UserEntity } from './user.entity';

@Injectable()
export class SiteKeyRepository extends BaseRepository<SiteKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(SiteKeyEntity, dataSource);
  }

  async findByUserSiteKeyAndType(
    user: UserEntity,
    siteKey: string,
    type: SiteKeyType,
  ): Promise<SiteKeyEntity | null> {
    return this.findOne({
      where: { user, siteKey, type },
    });
  }

  async findByUserAndType(
    user: UserEntity,
    type: SiteKeyType,
  ): Promise<SiteKeyEntity[]> {
    return this.find({ where: { user, type } });
  }
}
