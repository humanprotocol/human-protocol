import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from './escrow-completion-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowCompletionTrackingEntity]),
    ConfigModule,
  ],
  providers: [
    Logger,
    EscrowCompletionTrackingService,
    EscrowCompletionTrackingRepository,
  ],
  exports: [EscrowCompletionTrackingService],
})
export class EscrowCompletionTrackingModule {}
