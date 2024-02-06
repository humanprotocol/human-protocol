import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment';
import { BaseRepository } from '../../database/base.repository';
import { PaymentEntity } from './payment.entity';

@Injectable()
export class PaymentRepository extends BaseRepository<PaymentEntity> {
  constructor(private dataSource: DataSource) {
    super(PaymentEntity, dataSource);
  }

  public async findOneByTransaction(
    transaction: string,
    chainId?: ChainId,
  ): Promise<PaymentEntity | null> {
    const whereOptions: any = { transaction, ...(chainId && { chainId }) };

    return this.findOne({ where: whereOptions });
  }

  public findByUserAndStatus(
    userId: number,
    status: PaymentStatus,
  ): Promise<PaymentEntity[]> {
    return this.find({
      where: {
        userId,
        status,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
