import { Column, Entity } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IReputationWorker, OracleType } from "../common/decorators";

@Entity({ schema: NS, name: "reputation_worker" })
export class ReputationWorkerEntity extends BaseEntity implements IReputationWorker {
  @Column({ type: "int" })
  public chainId: number;

  @Column({ type: "varchar" })
  public publicKey: string;

  @Column({ type: "int" })
  public reputationPoints: number;

  @Column({
    type: "enum",
    enum: OracleType,
  })
  public type: OracleType;
}
