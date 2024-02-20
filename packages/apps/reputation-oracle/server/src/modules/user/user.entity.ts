import { Exclude } from 'class-transformer';
import { Column, Entity, OneToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { UserStatus, UserType } from '../../common/enums/user';
import { IUser } from '../../common/interfaces';
import { BaseEntity } from '../../database/base.entity';
import { AuthEntity } from '../auth/auth.entity';
import { TokenEntity } from '../auth/token.entity';
import { KycEntity } from '../kyc/kyc.entity';

@Entity({ schema: NS, name: 'users' })
export class UserEntity extends BaseEntity implements IUser {
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  public password: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public email: string;

  @Column({ type: 'enum', enum: UserType })
  public type: UserType;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public evmAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public nonce: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  public status: UserStatus;

  @OneToOne(() => AuthEntity)
  public auth: AuthEntity;

  @OneToOne(() => TokenEntity)
  public token: TokenEntity;

  @OneToOne(() => KycEntity, (kyc) => kyc.user)
  public kyc?: KycEntity;
}
