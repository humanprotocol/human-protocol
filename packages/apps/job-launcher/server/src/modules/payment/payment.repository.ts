import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { PaymentCreateDto } from './payment.dto';

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<PaymentEntity>,
    options?: FindOneOptions<PaymentEntity>,
  ): Promise<PaymentEntity | null> {
    const paymentEntity = await this.paymentEntityRepository.findOne({
      where,
      ...options,
    });

    return paymentEntity;
  }

  public find(
    where: FindOptionsWhere<PaymentEntity>,
    options?: FindManyOptions<PaymentEntity>,
  ): Promise<PaymentEntity[]> {
    return this.paymentEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: PaymentCreateDto): Promise<PaymentEntity> {
    return this.paymentEntityRepository.create(dto).save();
  }
}
