import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, IsNull, MoreThan } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { QualificationEntity } from './qualification.entity';

type FindOptions = {
  relations?: FindManyOptions<QualificationEntity>['relations'];
};

@Injectable()
export class QualificationRepository extends BaseRepository<QualificationEntity> {
  constructor(dataSource: DataSource) {
    super(QualificationEntity, dataSource);
  }

  async findByReference(
    reference: string,
    options: FindOptions = {},
  ): Promise<QualificationEntity | null> {
    const qualificationEntity = await this.findOne({
      where: { reference },
      relations: options.relations,
    });

    return qualificationEntity;
  }

  async getActiveQualifications(): Promise<QualificationEntity[]> {
    const now = new Date();

    return this.findBy([{ expiresAt: MoreThan(now) }, { expiresAt: IsNull() }]);
  }
}
