import { Module } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';

import { EmailService } from './email.service';
import { SendgridEmailService } from './sendgrid.service';

@Module({
  providers: [
    SendgridEmailService,
    MailService,
    {
      provide: EmailService,
      useClass: SendgridEmailService,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
