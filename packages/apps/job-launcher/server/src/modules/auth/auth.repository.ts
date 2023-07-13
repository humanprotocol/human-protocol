import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
  DeleteResult,
} from 'typeorm';
import { AuthEntity } from './auth.entity';
import { AuthCreateDto } from './auth.dto';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    @InjectRepository(AuthEntity)
    private readonly authEntityRepository: Repository<AuthEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<AuthEntity>,
    options?: FindOneOptions<AuthEntity>,
  ): Promise<AuthEntity | null> {
    const authEntity = await this.authEntityRepository.findOne({
      where,
      ...options,
    });
    console.log({
      where,
      ...options,
    });

    return authEntity;
  }

  public find(
    where: FindOptionsWhere<AuthEntity>,
    options?: FindManyOptions<AuthEntity>,
  ): Promise<AuthEntity[]> {
    return this.authEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: AuthCreateDto): Promise<AuthEntity> {
    return this.authEntityRepository.create(dto).save();
  }

  public async delete(
    where: FindOptionsWhere<AuthEntity>,
  ): Promise<DeleteResult> {
    return this.authEntityRepository.delete(where);
  }
}
