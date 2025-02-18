import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';
import { SendgridEmailService } from './sendgrid.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
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
