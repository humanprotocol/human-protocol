import { Injectable } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import {
  SENDGRID_API_KEY_DISABLED,
  SENDGRID_API_KEY_REGEX,
} from '../../common/constants';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';
import logger from '../../logger';

@Injectable()
export class SendGridService {
  private readonly logger = logger.child({ context: SendGridService.name });

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
        /**
         * Logging email data upon local development due
         */
        this.logger.debug('Email sent', personalizations);
        return;
      }

      await this.mailService.send({
        from,
        templateId,
        personalizations,
        ...emailData,
      });
    } catch (error) {
      const errorMessage = 'Failed to send email';

      this.logger.error(errorMessage, {
        error,
        templateId,
        to: personalizations?.map(({ to }) => to),
      });

      throw new Error(errorMessage);
    }
  }
}
