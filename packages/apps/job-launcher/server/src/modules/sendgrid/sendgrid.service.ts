import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, MailService } from '@sendgrid/mail';

import { ConfigNames } from '../../common/config';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.mailService.setApiKey(
      this.configService.get<string>(ConfigNames.SENDGRID_API_KEY) || '',
    );
  }

  async sendEmail(emailData: Partial<MailDataRequired>): Promise<void> {
    try {
      const from =
        this.configService.get<string>(ConfigNames.SENDGRID_FROM_EMAIL) || '';
      await this.mailService.send({
        ...emailData,
        text: emailData.text || '',
        from,
      });
      this.logger.log('Email sent successfully');
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
}
