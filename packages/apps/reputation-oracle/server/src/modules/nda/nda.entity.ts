import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionEntity } from './nda-version.entity';
import { NS } from '../../common/constants';
import { NdaStatus } from '../../common/enums';

@Entity({ schema: NS, name: 'ndas' })
export class NDAEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: NdaStatus,
    default: NdaStatus.SIGNED,
  })
  status: NdaStatus;

  @Column({ type: 'varchar' })
  ipAddress: string;

  @ManyToOne(() => UserEntity, (user) => user.ndas)
  user: UserEntity;

  @ManyToOne(() => NDAVersionEntity, (ndaVersion) => ndaVersion.ndas)
  ndaVersion: NDAVersionEntity;
}
