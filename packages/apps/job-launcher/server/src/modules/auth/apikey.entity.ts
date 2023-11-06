import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('api_keys')
export class ApiKeyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public hashedAPIKey: string;

  @Column({ type: 'varchar' })
  public salt: string;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public user: UserEntity;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt: Date;
}
