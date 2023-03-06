import { Column, Entity } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IReputationOracle, OracleType } from "../common/decorators";

@Entity({ schema: NS, name: "reputation_oracle" })
export class ReputationOracleEntity extends BaseEntity implements IReputationOracle {
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
