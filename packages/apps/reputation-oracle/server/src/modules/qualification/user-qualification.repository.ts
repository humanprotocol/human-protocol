import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

import { UserQualificationEntity } from './user-qualification.entity';

@Injectable()
export class UserQualificationRepository extends BaseRepository<UserQualificationEntity> {
  constructor(dataSource: DataSource) {
    super(UserQualificationEntity, dataSource);
  }

  async removeByUserAndQualification(
    userId: number,
    qualificationId: number,
  ): Promise<void> {
    await this.delete({ userId, qualificationId });
  }

  async findByQualification(
    qualificationId: number,
  ): Promise<UserQualificationEntity[]> {
    return this.findBy({ qualificationId });
  }
}
