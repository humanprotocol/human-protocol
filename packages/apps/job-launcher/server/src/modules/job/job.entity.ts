import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';

import { NS } from '../../common/constants';
import { IJob } from '../../common/interfaces';
import { JobRequestType, JobStatus, JobType } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { PaymentEntity } from '../payment/payment.entity';
import { ContentModerationRequestEntity } from '../content-moderation/content-moderation-request.entity';

@Entity({ schema: NS, name: 'jobs' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: 'int' })
  public chainId: number;

  @Column({ type: 'varchar' })
  public reputationOracle: string;

  @Column({ type: 'varchar' })
  public exchangeOracle: string;

  @Column({ type: 'varchar' })
  public recordingOracle: string;

  @Column({ type: 'varchar', nullable: true })
  public escrowAddress: string | null;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  public fee: number;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  public fundAmount: number;

  @Column({ type: 'varchar' })
  public token: string;

  @Column({ type: 'varchar' })
  public manifestUrl: string;

  @Column({ type: 'varchar' })
  public manifestHash: string;

  @Column({ type: 'varchar', nullable: true })
  public failedReason: string | null;

  @Column({
    type: 'enum',
    enum: JobType,
  })
  public requestType: JobRequestType;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  public status: JobStatus;

  @ManyToOne(() => UserEntity, (user) => user.jobs, { eager: true })
  user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.job)
  public payments: PaymentEntity[];

  @OneToMany(
    () => ContentModerationRequestEntity,
    (contentModerationRequest) => contentModerationRequest.job,
    { cascade: ['insert'] },
  )
  public contentModerationRequests: ContentModerationRequestEntity[];

  @Column({ type: 'int', default: 0 })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;
}
