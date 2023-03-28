import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { NS } from "../common/constants";
import { IPayment } from "../common/decorators";
import { Currency, PaymentType } from "../common/enums/currencies";
import { BaseEntity } from "../database/base.entity";
import { UserEntity } from "../user/user.entity";

@Entity({ schema: NS, name: "payment" })
export class PaymentEntity extends BaseEntity implements IPayment {
  @Column({ type: "decimal", precision: 5, scale: 2 })
  public amount: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  public rate: number;

  @Column({
    type: "enum",
    enum: Currency,
  })
  public currency: Currency;

  @Column({
    type: "enum",
    enum: PaymentType,
  })
  public type: PaymentType;

  @JoinColumn()
  @ManyToOne(() => UserEntity, user => user.payments)
  public user: UserEntity;

  @Column({ type: "int" })
  public userId: number;
}
