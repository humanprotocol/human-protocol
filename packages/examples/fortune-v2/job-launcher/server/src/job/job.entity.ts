import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { UserEntity } from "../user/user.entity";
import { PaymentEntity } from "../payment/payment.entity";
import { IJob } from "../common/decorators";
import { JobStatus } from "../common/enums/job";

@Entity({ schema: NS, name: "job" })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: "int" })
  public chainId: number;

  @Column({ type: "varchar" })
  public escrowAddress: string;

  @Column({ type: "varchar" })
  public manifestUrl: string;

  @Column({
    type: "enum",
    enum: JobStatus,
  })
  public status: JobStatus;

  @ManyToOne(() => UserEntity, (user) => user.jobs, { eager: true })
  user: UserEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.job)
  payments: PaymentEntity[];

  @Column({ type: "int" })
  public userId: number;

  @Column({ type: "int" })
  public retriesCount: number;

  @Column({ type: "timestamptz" })
  public waitUntil: Date;
}
