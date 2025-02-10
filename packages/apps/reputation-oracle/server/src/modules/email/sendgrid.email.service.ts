import { Injectable } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';

import { EmailService } from './email.service';
import { EmailAction, SENDGRID_API_KEY_REGEX } from './constants';
import logger from '../../logger';
import { EmailConfigService } from '../../common/config/email-config.service';
import { isDevelopmentEnv } from '../../common/utils/environment';

const SENDGRID_TEMPLATES = {
  signup: 'd-ca99cc7410aa4e6dab3e6042d5ecb9a3',
  resetPassword: 'd-3ac74546352a4e1abdd1689947632c22',
  passwordChanged: 'd-ca0ac7e6fff845829cd0167af09f25cf',
};
const SERVICE_NAME = 'App';

@Injectable()
export class SendgridEmailService extends EmailService {
  private readonly logger = logger.child({
    context: SendgridEmailService.name,
  });
  constructor(
    private readonly mailService: MailService,
    private readonly emailConfigService: EmailConfigService,
  ) {
    super();
    if (!isDevelopmentEnv()) {
      if (!SENDGRID_API_KEY_REGEX.test(this.emailConfigService.apiKey)) {
        throw new Error('Invalid SendGrid API key');
      }
      this.mailService.setApiKey(emailConfigService.apiKey);
    }
  }

  async sendEmail(
    to: string,
    action: EmailAction,
    payload?: Record<string, any>,
  ): Promise<void> {
    if (isDevelopmentEnv()) {
      /**
       * Logging email data upon local development
       */
      this.logger.debug('Email sent (development mode):', {
        to,
        action,
        payload,
      });
      return;
    }
    const from = {
      email: this.emailConfigService.from,
      name: this.emailConfigService.fromName,
    };

    const templateId = this.getTemplateId(action);
    const dynamicTemplateData = {
      service_name: SERVICE_NAME,
      ...payload,
    };
    try {
      await this.mailService.send({
        from,
        to,
        templateId,
        dynamicTemplateData,
      });
    } catch (error) {
      const errorMessage = 'Failed to send email';

      this.logger.error(errorMessage, {
        error,
        to,
        action,
        payload,
      });

      throw new Error(errorMessage);
    }
  }

  private getTemplateId(action: EmailAction): string {
    switch (action) {
      case EmailAction.SIGNUP:
        return SENDGRID_TEMPLATES.signup;
      case EmailAction.RESET_PASSWORD:
        return SENDGRID_TEMPLATES.resetPassword;
      case EmailAction.PASSWORD_CHANGED:
        return SENDGRID_TEMPLATES.passwordChanged;
    }
  }
}
