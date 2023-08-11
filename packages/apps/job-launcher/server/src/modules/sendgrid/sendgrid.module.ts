import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';

import { SendGridService } from './sendgrid.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SendGridService, MailService],
  exports: [SendGridService],
})
export class SendGridModule {}
