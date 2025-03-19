import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;
}
