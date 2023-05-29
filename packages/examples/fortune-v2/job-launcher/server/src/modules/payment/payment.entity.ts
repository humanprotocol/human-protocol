import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { NS } from "../../common/constants";
import { BaseEntity } from "../../database/base.entity";
import { Currency, PaymentSource, PaymentType } from "../../common/enums/payment";
import { UserEntity } from "../user/user.entity";

@Entity({ schema: NS, name: "payment" })
export class PaymentEntity extends BaseEntity {
  @Column({ type: "varchar", default: null, nullable: true })
  public paymentId: string;

  @Column({ type: "varchar", default: null, nullable: true })
  public transactionHash: string;
  
  @Column({ type: "bigint" })
  public amount: string;

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

  @Column({
    type: "enum",
    enum: PaymentSource,
  })
  public source: PaymentSource;

  @JoinColumn()
  @ManyToOne(() => UserEntity, user => user.payments)
  public user: UserEntity;

  @Column({ type: "int" })
  public userId: number;
}
