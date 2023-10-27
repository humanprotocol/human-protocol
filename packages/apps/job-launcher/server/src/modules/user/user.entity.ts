import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { IUser } from '../../common/interfaces';
import { UserStatus, UserType } from '../../common/enums/user';
import { PaymentEntity } from '../payment/payment.entity';
import { JobEntity } from '../job/job.entity';
import { TokenEntity } from '../auth/token.entity';
import { AuthEntity } from '../auth/auth.entity';

@Entity({ schema: NS, name: 'users' })
export class UserEntity extends BaseEntity implements IUser {
  @Exclude()
  @Column({ type: 'varchar' })
  public password: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public email: string;

  @Column({ type: 'enum', enum: UserType })
  public type: UserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  public status: UserStatus;

  @OneToOne(() => AuthEntity)
  public auth: AuthEntity;

  @OneToOne(() => TokenEntity)
  public token: TokenEntity;

  @OneToMany(() => JobEntity, (job) => job.user)
  public jobs: JobEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.user)
  public payments: PaymentEntity[];

  @OneToOne(() => ApiKeyEntity, apiKey => apiKey.user)
  public apiKey: ApiKeyEntity;

}

@Entity({ schema: NS, name: 'api_keys' })
export class ApiKeyEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  hashedAPIKey: string;

  @Column({ type: 'varchar' })
  salt: string;

  @OneToOne(() => UserEntity, user => user.apiKey)
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}