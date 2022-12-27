import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IJob, JobStatus, JobMode, JobRequestType } from "../common/decorators";
import { UserEntity } from "../user/user.entity";
import { NetworkId } from "../common/constants/networks";

@Entity({ schema: NS, name: "job" })
export class JobEntity extends BaseEntity implements IJob {
  @Column({ type: "varchar" })
  public dataUrl: string;

  @Column({ type: "text" })
  public data: string;

  @Column({ type: "varchar" })
  public manifestHash: string;

  @Column({ type: "int" })
  public datasetLength: number;

  @Column({ type: "int" })
  public annotationsPerImage: number;

  @Column("varchar", { array: true })
  public labels: string[];

  @Column({ type: "varchar" })
  public requesterDescription: string;

  @Column({ type: "decimal" })
  public requesterAccuracyTarget: number;

  @Column({ type: "varchar" })
  public recordingOracleAddress: string;

  @Column({ type: "varchar" })
  public reputationOracleAddress: string;

  @Column({ type: "varchar" })
  public exchangeOracleAddress: string;

  @Column({ type: "varchar" })
  public recordingOracleUrl: string;

  @Column({ type: "varchar" })
  public reputationOracleUrl: string;

  @Column({ type: "varchar" })
  public exchangeOracleUrl: string;

  @Column({ type: "decimal" })
  public recordingOracleStake: number;

  @Column({ type: "decimal" })
  public reputationOracleStake: number;

  @Column({ type: "varchar" })
  public tokenAddress: string;

  @Column({ type: "varchar" })
  public escrowAddress: string;

  @Column({ type: "decimal" })
  public price: number;

  @Column({ type: "decimal" })
  public fee: number;

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

  @Column({ type: "varchar" })
  public networkId: NetworkId;
}
