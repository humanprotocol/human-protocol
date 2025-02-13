import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionEntity } from './nda-version.entity';
import { NS } from '../../common/constants';
import { NdaSignatureStatus } from '../../common/enums';

@Entity({ schema: NS, name: 'nda_signatures' })
export class NDASignatureEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: NdaSignatureStatus,
  })
  status: NdaSignatureStatus;

  @Column({ type: 'varchar' })
  ipAddress: string;

  @ManyToOne(() => UserEntity, (user) => user.ndaSignatures)
  @JoinColumn()
  user: UserEntity;

  @ManyToOne(() => NDAVersionEntity, (ndaVersion) => ndaVersion.ndas)
  @JoinColumn()
  ndaVersion: NDAVersionEntity;

  @Column({ type: 'int' })
  ndaVersionId: number;

  @Column({ type: 'int' })
  userId: number;
}
