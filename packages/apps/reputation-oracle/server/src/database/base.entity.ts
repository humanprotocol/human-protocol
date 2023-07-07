import {
  BaseEntity as OrmBaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseEntity extends OrmBaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamptz' })
  public createdAt: Date;

  @Column({ type: 'timestamptz' })
  public updatedAt: Date;

  @BeforeInsert()
  public beforeInsert(): void {
    const date = new Date();
    this.createdAt = date;
    this.updatedAt = date;
  }

  @BeforeUpdate()
  public beforeUpdate(): void {
    const date = new Date();
    this.updatedAt = date;
  }
}
