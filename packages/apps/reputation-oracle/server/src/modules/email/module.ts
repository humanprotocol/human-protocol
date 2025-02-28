import { Module } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';

import { SendgridEmailService } from './sendgrid.service';
import { EmailService } from './email.service';

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
