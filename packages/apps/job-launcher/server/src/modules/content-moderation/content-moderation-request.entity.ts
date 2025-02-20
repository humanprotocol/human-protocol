import { Column, Entity, ManyToOne } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { ContentModerationRequestStatus } from '../../common/enums/content-moderation';
import { JobEntity } from '../job/job.entity';

@Entity({ schema: NS, name: 'content-moderation-requests' })
export class ContentModerationRequestEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  public dataUrl: string;

  @Column({ type: 'int', nullable: false })
  public from: number;

  @Column({ type: 'int', nullable: false })
  public to: number;

  @Column({ type: 'varchar', nullable: true })
  public abuseReason: string;

  @Column({
    type: 'enum',
    enum: ContentModerationRequestStatus,
  })
  public status: ContentModerationRequestStatus;

  @ManyToOne(() => JobEntity, (job) => job.contentModerationRequests, {
    eager: true,
  })
  job: JobEntity;

  @Column({ type: 'int', nullable: false })
  public jobId: number;
}
