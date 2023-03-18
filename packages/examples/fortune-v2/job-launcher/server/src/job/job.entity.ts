import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IJob, JobStatus, JobMode, JobRequestType } from "../common/decorators";
import { UserEntity } from "../user/user.entity";
import { PaymentEntity } from "../payment/payment.entity";

@Entity({ schema: NS, name: "job" })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: "int" })
  public chainId: number;

  @Column({ type: "varchar" })
  public dataUrl: string;

  @Column({ type: "int" })
  public submissionsRequired: number;

  @Column("varchar", { array: true })
  public labels: string[];

  @Column({ type: "varchar", nullable: true })
  public requesterTitle: string;

  @Column({ type: "varchar" })
  public requesterDescription: string;

  @Column({ type: "decimal" })
  public requesterAccuracyTarget: number;

  @Column({ type: "varchar" })
  public escrowAddress: string;

  @Column({ type: "decimal" })
  public price: number;

  @Column({ type: "enum", enum: JobMode })
  public mode: JobMode;

  @Column({ type: "enum", enum: JobRequestType })
  public requestType: JobRequestType;

  @Column({
    type: "enum",
    enum: JobStatus,
  })
  public status: JobStatus;

  //@JoinColumn()
  //@ManyToOne(_type => UserEntity)
  //public user: UserEntity;
  //@JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.jobs, { eager: true })
  user: UserEntity;

  //@JoinColumn()
  @OneToMany(() => PaymentEntity, (payment) => payment.job)
  payments: PaymentEntity[];

  @Column({ type: "int" })
  public userId: number;

  @Column({ type: "int" })
  public retriesCount: number;

  @Column({ type: "timestamptz" })
  public waitUntil: Date;
}
