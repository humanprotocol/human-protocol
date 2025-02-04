import { Injectable, Logger } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import {
  SENDGRID_API_KEY_DISABLED,
  SENDGRID_API_KEY_REGEX,
} from '../../common/constants';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly sendgridConfigService: SendgridConfigService,
  ) {
    if (this.sendgridConfigService.apiKey === SENDGRID_API_KEY_DISABLED) {
      return;
    }

    if (!SENDGRID_API_KEY_REGEX.test(this.sendgridConfigService.apiKey)) {
      throw new Error('Invalid SendGrid API key');
    }

    this.mailService.setApiKey(this.sendgridConfigService.apiKey);
  }

  async sendEmail({
    from = {
      email: this.sendgridConfigService.fromEmail,
      name: this.sendgridConfigService.fromName,
    },
    templateId = '',
    personalizations,
    ...emailData
  }: Partial<MailDataRequired>): Promise<void> {
    try {
      if (this.sendgridConfigService.apiKey === SENDGRID_API_KEY_DISABLED) {
        this.logger.debug(personalizations);
        return;
      }

      await this.mailService.send({
        from,
        templateId,
        personalizations,
        ...emailData,
      });
      this.logger.log('Email sent successfully');
      return;
    } catch (error) {
      const errorMessage = 'Failed to send email';
      this.logger.error(errorMessage, error.messages, error.stack);
      throw new Error(errorMessage);
    }
  }
}
