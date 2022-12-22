import { Column, Entity } from "typeorm";
import { Exclude } from "class-transformer";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IUser, UserStatus, UserType } from "../common/decorators";

@Entity({ schema: NS, name: "user" })
export class UserEntity extends BaseEntity implements IUser {
  @Exclude()
  @Column({ type: "varchar", select: false })
  public password: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  public email: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  public tokenAddress: string;

  @Column({ type: "enum", enum: UserType })
  public type: UserType;

  @Column({
    type: "enum",
    enum: UserStatus,
  })
  public status: UserStatus;
}
