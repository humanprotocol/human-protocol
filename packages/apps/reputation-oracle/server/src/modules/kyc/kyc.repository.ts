import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

import { KycEntity } from './kyc.entity';
import { ErrorKyc } from '../../common/constants/errors';
import { KycCreateDto, KycUpdateDto } from './kyc.dto';

@Injectable()
export class KycRepository {
  private readonly logger = new Logger(KycRepository.name);

  constructor(
    @InjectRepository(KycEntity)
    private readonly kycEntityRepository: Repository<KycEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<KycEntity>,
    dto: Partial<KycUpdateDto>,
  ): Promise<KycEntity> {
    const kycEntity = await this.kycEntityRepository.findOneBy(where);

    if (!kycEntity) {
      this.logger.log(ErrorKyc.NotFound, KycRepository.name);
      throw new NotFoundException(ErrorKyc.NotFound);
    }

    Object.assign(kycEntity, dto);
    return kycEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<KycEntity>,
    options?: FindOneOptions<KycEntity>,
  ): Promise<KycEntity | null> {
    const userEntity = await this.kycEntityRepository.findOne({
      where,
      ...options,
    });

    return userEntity;
  }

  public find(
    where: FindOptionsWhere<KycEntity>,
    options?: FindManyOptions<KycEntity>,
  ): Promise<KycEntity[]> {
    return this.kycEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: KycCreateDto): Promise<KycEntity> {
    return this.kycEntityRepository.create(dto).save();
  }
}
