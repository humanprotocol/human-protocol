import { Column, Entity } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { CredentialStatus } from '../../common/enums/credential';

@Entity({ schema: NS, name: 'credential' })
export class CredentialEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public reference: string;

  @Column({ type: 'text' })
  public description: string;

  @Column({ type: 'varchar' })
  public url: string;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
  })
  public status: CredentialStatus;

  @Column({ type: 'timestamp' })
  public startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public expiresAt: Date;
}
