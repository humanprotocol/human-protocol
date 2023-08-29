import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import {
  PaymentSource,
  PaymentStatus,
  PaymentType,
} from '../../common/enums/payment';
import { UserEntity } from '../user/user.entity';
import { JobEntity } from '../job/job.entity';

@Entity({ schema: NS, name: 'payments' })
@Index(['chainId', 'transaction'], {
  unique: true,
  where: '(chain_Id IS NOT NULL AND transaction IS NOT NULL)',
})
@Index(['transaction'], {
  unique: true,
  where: '(chain_Id IS NULL AND transaction IS NOT NULL)',
})
export class PaymentEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public transaction: string;

  @Column({ type: 'int', nullable: true })
  public chainId: number;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  public amount: number;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  public rate: number;

  @Column({ type: 'varchar' })
  public currency: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  public type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentSource,
  })
  public source: PaymentSource;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  public status: PaymentStatus;

  @JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.payments)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;

  @JoinColumn()
  @OneToOne(() => JobEntity, (job) => job.payment)
  public job: JobEntity;

  @Column({ type: 'int', nullable: true  })
  public jobId: number;
}
