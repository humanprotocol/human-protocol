import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, In, MoreThan } from 'typeorm';
import { QualificationEntity } from './qualification.entity';
import { UserEntity } from '../user/user.entity';
import { UserQualificationEntity } from './user-qualification.entity';

@Injectable()
export class QualificationRepository extends BaseRepository<QualificationEntity> {
  private readonly logger = new Logger(QualificationRepository.name);

  constructor(private dataSource: DataSource) {
    super(QualificationEntity, dataSource);
  }

  async findByReference(
    reference: string,
  ): Promise<QualificationEntity | null> {
    const currentDate = new Date();

    const qualificationEntity = this.findOne({
      where: { reference, expiresAt: MoreThan(currentDate) },
      relations: ['userQualifications', 'userQualifications.user'],
    });
    return qualificationEntity;
  }

  async getQualifications(): Promise<QualificationEntity[]> {
    const currentDate = new Date();

    return this.findBy({ expiresAt: MoreThan(currentDate) });
  }

  async saveUserQualifications(
    userQualifications: UserQualificationEntity[],
  ): Promise<void> {
    await this.dataSource
      .getRepository(UserQualificationEntity)
      .save(userQualifications);
  }

  async removeUserQualifications(
    users: UserEntity[],
    qualification: QualificationEntity,
  ): Promise<void> {
    const userQualifications = await this.dataSource
      .getRepository(UserQualificationEntity)
      .find({
        where: {
          user: { id: In(users.map((user) => user.id)) },
          qualification: { id: qualification.id },
        },
      });
    await this.dataSource
      .getRepository(UserQualificationEntity)
      .remove(userQualifications);
  }
}
