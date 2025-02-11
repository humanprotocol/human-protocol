import { NS } from '../../common/constants';
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { NDASignatureEntity } from './nda-signature.entity';

@Entity({ schema: NS, name: 'nda_versions' })
export class NDAVersionEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  version: string;

  @Column({ type: 'text' })
  documentText: string;

  @OneToMany(() => NDASignatureEntity, (nda) => nda.ndaVersion)
  ndas: NDASignatureEntity[];
}
