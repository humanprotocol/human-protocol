import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { WhitelistEntity } from './whitelist.entity';

@Injectable()
export class WhitelistRepository extends BaseRepository<WhitelistEntity> {
  constructor(private dataSource: DataSource) {
    super(WhitelistEntity, dataSource);
  }

  public findOneByUserId(userId: number): Promise<WhitelistEntity | null> {
    return this.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
