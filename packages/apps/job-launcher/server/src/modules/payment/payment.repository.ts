import { Injectable } from '@nestjs/common';
import { PaymentEntity } from './payment.entity';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { handleQueryFailedError } from '../../database/database.error';
import { PaymentStatus } from 'src/common/enums/payment';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class PaymentRepository extends Repository<PaymentEntity> {
  constructor(private dataSource: DataSource) {
    super(PaymentEntity, dataSource.createEntityManager());
  }

  async createUnique(payment: PaymentEntity): Promise<PaymentEntity> {
    try {
      await this.insert(payment);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return payment;
  }

  public async updateOne(payment: PaymentEntity): Promise<PaymentEntity> {
    try {
      await this.save(payment);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return payment;
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
