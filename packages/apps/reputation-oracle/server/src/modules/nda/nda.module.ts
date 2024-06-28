import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { NDAEntity } from './nda.entity';
import { UserModule } from '../user/user.module';
import { NDAVersionEntity } from './nda-version.entity';
import { NDARepository } from './nda.repository';
import { NDAVersionRepository } from './nda-version.repository';
import { NDAController } from './nda.controller';
import { NDAService } from './nda.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NDAVersionEntity, NDAEntity]),
    ConfigModule,
    UserModule,
  ],
  providers: [Logger, NDAService, NDAVersionRepository, NDARepository],
  controllers: [NDAController],
  exports: [NDAService],
})
export class NDAModule {}
