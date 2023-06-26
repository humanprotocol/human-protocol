import { Module, Logger } from '@nestjs/common';

import { TypeOrmLoggerService } from './typeorm-logger.service';

@Module({
  providers: [Logger, TypeOrmLoggerService],
  exports: [TypeOrmLoggerService],
})
export class TypeOrmLoggerModule {}
