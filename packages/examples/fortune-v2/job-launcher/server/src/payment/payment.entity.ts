import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { NS } from "../common/constants";
import { Currency, IPayment, PaymentStatus } from "../common/decorators";
import { BaseEntity } from "../database/base.entity";
import { JobEntity } from "../job/job.entity";


@Entity({ schema: NS, name: "payment" })
export class PaymentEntity extends BaseEntity implements IPayment {
  @Column({ type: "varchar" })
  public paymentId: string;

  @Column({ type: "int" })
  public amount: number;

  @Column({ type: "varchar" })
  public clientSecret: string;

  @Column({
    type: "enum",
    enum: Currency,
  })
  public currency: Currency;

  @Column({ type: "varchar", nullable: true })
  public customer: string;
  
  @Column({ type: "text", nullable: true })
  public errorMessage: string;

  @Column({ type: "varchar" })
  public method: string;

  @Column({
    type: "enum",
    enum: PaymentStatus,
  })
  public status: PaymentStatus;

  @JoinColumn()
  @OneToOne(_type => JobEntity)
  public job: JobEntity;

  @Column({ type: "int" })
  public jobId: number;
}