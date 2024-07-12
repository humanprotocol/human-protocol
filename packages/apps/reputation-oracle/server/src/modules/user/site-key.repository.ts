import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { SiteKeyEntity } from './site-key.entity';

@Injectable()
export class SiteKeyRepository extends BaseRepository<SiteKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(SiteKeyEntity, dataSource);
  }

  async findById(id: number): Promise<SiteKeyEntity | null> {
    return this.findOne({ where: { id }, relations: { user: true } });
  }

  async findBySiteKey(siteKey: string): Promise<SiteKeyEntity | null> {
    return this.findOne({ where: { siteKey }, relations: { user: true } });
  }
}
