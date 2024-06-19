import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { NDAVersionEntity } from './nda-version.entity';

@Injectable()
export class NDAVersionRepository extends BaseRepository<NDAVersionEntity> {
  constructor(private dataSource: DataSource) {
    super(NDAVersionEntity, dataSource);
  }

  async getLastNDAVersion(): Promise<NDAVersionEntity | null> {
    return this.findOne({
      order: { createdAt: 'DESC' },
      where: {},
    });
  }
}
