import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { PaymentInfoEntity } from './payment-info.entity';

@Injectable()
export class PaymentInfoRepository extends BaseRepository<PaymentInfoEntity> {
  constructor(private dataSource: DataSource) {
    super(PaymentInfoEntity, dataSource);
  }

  public findOneByUser(userId: number): Promise<PaymentInfoEntity | null> {
    return this.findOne({
      where: {
        userId,
      },
    });
  }
}
