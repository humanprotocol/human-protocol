import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IJob, JobStatus, JobMode, JobRequestType } from "../common/decorators";
import { UserEntity } from "../user/user.entity";

@Entity({ schema: NS, name: "job" })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: "int" })
  public chainId: number;

  @Column({ type: "varchar" })
  public dataUrl: string;

  @Column({ type: "text" })
  public data: string;

  @Column({ type: "int" })
  public requestsRequired: number;

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

  @JoinColumn()
  @OneToOne(_type => UserEntity)
  public user: UserEntity;

  @Column({ type: "int" })
  public userId: number;
}
