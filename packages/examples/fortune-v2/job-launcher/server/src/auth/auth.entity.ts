import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { NS } from "../common/constants";
import { UserEntity } from "../user/user.entity";
import { BaseEntity } from "../database/base.entity";

@Entity({ schema: NS, name: "auth" })
export class AuthEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: "varchar" })
  public refreshToken: string;

  @Column({ type: "bigint" })
  public refreshTokenExpiresAt: number;

  @JoinColumn()
  @OneToOne(_type => UserEntity)
  public user: UserEntity;

  @Column({ type: "int" })
  public userId: number;

  @Column({
    type: "varchar",
    select: false,
  })
  public ip: string;
}
