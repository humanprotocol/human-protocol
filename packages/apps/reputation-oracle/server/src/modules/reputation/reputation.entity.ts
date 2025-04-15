import { Column, Entity } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';

import { ReputationEntityType } from './constants';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'reputation' })
export class ReputationEntity extends BaseEntity {
  @Column({ type: 'int' })
  chainId: number;

  @Column({ type: 'varchar' })
  address: string;

  @Column({
    type: 'enum',
    enum: ReputationEntityType,
  })
  type: ReputationEntityType;

  @Column({ type: 'int' })
  reputationPoints: number;
}
