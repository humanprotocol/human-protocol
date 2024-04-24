import { Module } from '@nestjs/common';
import { DisableOperatorController } from './disable-operator.controller';
import { DisableOperatorService } from './disable-operator.service';

@Module({
  controllers: [DisableOperatorController],
  providers: [DisableOperatorService],
})
export class DisableOperatorModule {}
