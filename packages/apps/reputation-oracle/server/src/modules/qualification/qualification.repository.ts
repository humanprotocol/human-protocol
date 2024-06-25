import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { QualificationEntity } from './qualification.entity';

@Injectable()
export class QualificationRepository extends BaseRepository<QualificationEntity> {
  private readonly logger = new Logger(QualificationRepository.name);

  constructor(private dataSource: DataSource) {
    super(QualificationRepository, dataSource);
  }

  async findByReference(
    reference: string,
  ): Promise<QualificationEntity | null> {
    const qualificationEntity = this.findOne({ where: { reference } });
    return qualificationEntity;
  }

  async getQualifications(): Promise<QualificationEntity[]> {
    const currentDate = new Date();

    const queryBuilder = this.createQueryBuilder('qualification').where(
      'qualification.expiresAt > :currentDate',
      { currentDate },
    );

    const qualifications = await queryBuilder.getMany();
    return qualifications;
  }
}
