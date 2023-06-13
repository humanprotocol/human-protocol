import { Column, Entity, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { IJob } from '../../common/decorators';
import { JobStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'job' })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: 'int' })
  public chainId: number;

  @Column({ type: 'varchar' })
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

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;
}
