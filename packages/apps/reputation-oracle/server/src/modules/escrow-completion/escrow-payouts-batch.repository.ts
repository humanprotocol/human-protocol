import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { EscrowPayoutsBatchEntity } from './escrow-payouts-batch.entity';

@Injectable()
export class EscrowPayoutsBatchRepository extends BaseRepository<EscrowPayoutsBatchEntity> {
  private readonly logger = new Logger(EscrowPayoutsBatchRepository.name);
  constructor(private dataSource: DataSource) {
    super(EscrowPayoutsBatchEntity, dataSource);
  }
}
