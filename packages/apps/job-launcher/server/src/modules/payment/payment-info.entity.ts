import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'payments-info' })
@Index(['userId'], {
  unique: true,
})
@Index(['customerId'], {
  unique: true,
})
export class PaymentInfoEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  public customerId: string;

  @Column({ type: 'varchar' })
  public paymentMethodId: string;

  @JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.payments)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
