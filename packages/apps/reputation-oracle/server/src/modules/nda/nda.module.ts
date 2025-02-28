import { Module } from '@nestjs/common';
import { NDAController } from './nda.controller';
import { NDAService } from './nda.service';
import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [UserModule],
  controllers: [NDAController],
  providers: [NDAService, UserRepository],
})
export class NDAModule {}
