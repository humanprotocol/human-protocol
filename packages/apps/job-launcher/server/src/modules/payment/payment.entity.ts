import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'payments' })
@Index(['chainId', 'transaction'], {
  unique: true,
  where: '(chain_Id IS NOT NULL)',
})
@Index(['transaction'], { unique: true, where: '(chain_Id IS NULL)' })
export class PaymentEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  public transaction: string;

  @Column({ type: 'int', nullable: true })
  public chainId: number;

  @Column({ type: 'varchar' })
  public amount: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
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

  @JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.payments)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
