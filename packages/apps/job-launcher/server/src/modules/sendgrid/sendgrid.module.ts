import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SendGridService } from './sendgrid.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SendGridService],
  exports: [SendGridService],
})
export class SendGridModule {}
