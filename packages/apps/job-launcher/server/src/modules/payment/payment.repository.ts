import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { PaymentStatus, PaymentType } from '../../common/enums/payment';
import { BaseRepository } from '../../database/base.repository';
import { PaymentEntity } from './payment.entity';
import { ListResult } from '../payment/payment.interface';
import { GetPaymentsDto } from './payment.dto';
import { convertToDatabaseSortDirection } from '../../database/database.utils';

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

  public findByUserTypeAndStatus(
    userId: number,
    type: PaymentType | PaymentType[],
    status: PaymentStatus | PaymentStatus[],
  ): Promise<PaymentEntity[]> {
    const typeArray = Array.isArray(type) ? type : [type];
    const statusArray = Array.isArray(status) ? status : [status];
    return this.find({
      where: {
        userId,
        type: In(typeArray),
        status: In(statusArray),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  public async fetchFiltered(
    data: GetPaymentsDto,
    userId: number,
  ): Promise<ListResult> {
    const queryBuilder = this.createQueryBuilder('payment');
    queryBuilder.leftJoinAndSelect('payment.job', 'job');

    const dbSortDirection = convertToDatabaseSortDirection(data.sort);
    queryBuilder.orderBy(`payment.${data.sortField}`, dbSortDirection);

    queryBuilder.where('payment.userId = :userId', { userId });

    queryBuilder.offset(data.skip).limit(data.pageSize);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    return { entities, itemCount };
  }
}
