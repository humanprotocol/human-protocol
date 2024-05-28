import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'credentials' })
export class CredentialEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public reference: string;

  @ManyToOne(() => UserEntity, { eager: true })
  validator: UserEntity;

  @Column({ type: 'text' })
  public description: string;

  @Column({ type: 'varchar' })
  public url: string;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
  })
  public status: CredentialStatus;

  @Column({ type: 'timestamptz' })
  public startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  public expiresAt?: Date;

  @OneToMany(
    () => CredentialValidationEntity,
    (validation) => validation.credential,
  )
  validations: CredentialValidationEntity[];
}

@Entity('credential_validations')
export class CredentialValidationEntity extends BaseEntity {
  @ManyToOne(() => CredentialEntity, { eager: true })
  credential: CredentialEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @Column({ type: 'enum', enum: ['VALIDATED', 'ON_CHAIN'] })
  status: string;

  @Column({ nullable: true })
  certificate: string;
}
