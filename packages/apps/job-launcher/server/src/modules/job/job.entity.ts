import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { IJob } from '../../common/interfaces';
import { JobStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'jobs' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: 'int', nullable: true })
  public chainId: number;

  @Column({ type: 'varchar', nullable: true })
  public escrowAddress: string;

  @Column({ type: 'varchar' })
  public fee: string;

  @Column({ type: 'varchar' })
  public fundAmount: string;

  @Column({ type: 'varchar' })
  public manifestUrl: string;

  @Column({ type: 'varchar' })
  public manifestHash: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  public status: JobStatus;

  @ManyToOne(() => UserEntity, (user) => user.jobs, { eager: true })
  user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;

  @Column({ type: 'int', default: 0 })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;
}
