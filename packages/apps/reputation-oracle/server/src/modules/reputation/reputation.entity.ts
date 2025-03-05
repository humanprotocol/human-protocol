import { Column, Entity } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { ReputationEntityType } from '../../common/enums';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'reputation' })
export class ReputationEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: number;

  @Column({ type: 'varchar' })
  public address: string;

  @Column({ type: 'int' })
  public reputationPoints: number;

  @Column({
    type: 'enum',
    enum: ReputationEntityType,
  })
  public type: ReputationEntityType;
}
