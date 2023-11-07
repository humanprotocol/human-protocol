import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { ReputationEntity } from './reputation.entity';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { ErrorReputation } from '../../common/constants/errors';
import { ReputationCreateDto, ReputationUpdateDto } from './reputation.dto';

@Injectable()
export class ReputationRepository {
  private readonly logger = new Logger(ReputationRepository.name);

  constructor(
    @InjectRepository(ReputationEntity)
    private readonly reputationEntityRepository: Repository<ReputationEntity>,
    private readonly configService: ConfigService,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<ReputationEntity>,
    dto: Partial<ReputationUpdateDto>,
  ): Promise<ReputationEntity> {
    const reputationEntity = await this.reputationEntityRepository.findOneBy(
      where,
    );

    if (!reputationEntity) {
      this.logger.log(ErrorReputation.NotFound, ReputationRepository.name);
      throw new NotFoundException(ErrorReputation.NotFound);
    }

    Object.assign(reputationEntity, dto);
    return reputationEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<ReputationEntity>,
    options?: FindOneOptions<ReputationEntity>,
  ): Promise<ReputationEntity | null> {
    return this.reputationEntityRepository.findOne({
      where,
      ...options,
    });
  }

  public find(
    where: FindOptionsWhere<ReputationEntity>,
    options?: FindManyOptions<ReputationEntity>,
  ): Promise<ReputationEntity[]> {
    return this.reputationEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: ReputationCreateDto): Promise<ReputationEntity> {
    return this.reputationEntityRepository.create(dto).save();
  }
}
