import { Module } from '@nestjs/common';
import { NDAController } from './nda.controller';
import { NDAService } from './nda.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [NDAController],
  providers: [NDAService],
})
export class NDAModule {}
