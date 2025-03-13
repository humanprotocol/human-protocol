import { Module } from '@nestjs/common';

import { UserModule } from '../user';
import { NDAController } from './nda.controller';
import { NDAService } from './nda.service';

@Module({
  imports: [UserModule],
  controllers: [NDAController],
  providers: [NDAService],
})
export class NDAModule {}
