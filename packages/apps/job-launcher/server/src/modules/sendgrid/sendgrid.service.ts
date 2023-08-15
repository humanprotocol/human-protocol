import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, MailService } from '@sendgrid/mail';

import { ConfigNames } from '../../common/config';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  private readonly defaultFromEmail: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.mailService.setApiKey(
      this.configService.get<string>(ConfigNames.SENDGRID_API_KEY) || '',
    );

    this.defaultFromEmail =
      this.configService.get<string>(ConfigNames.SENDGRID_FROM_EMAIL) ||
      'job-launcher@hmt.ai';
    this.defaultFromName =
      this.configService.get<string>(ConfigNames.SENDGRID_FROM_NAME) ||
      'Human Protocol Job Launcher';
  }

  async sendEmail({
    text = '',
    from = {
      email: this.defaultFromEmail,
      name: this.defaultFromName,
    },
    ...emailData
  }: Partial<MailDataRequired>): Promise<void> {
    try {
      await this.mailService.send({
        from,
        text,
        ...emailData,
      });
      this.logger.log('Email sent successfully');
    } catch (error) {
      this.logger.error(`Error sending email: ${error}`);
      throw error;
    }
  }
}
