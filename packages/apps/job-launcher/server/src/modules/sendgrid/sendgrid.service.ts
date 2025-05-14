import { Injectable, Logger } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';
import {
  SENDGRID_API_KEY_DISABLED,
  SENDGRID_API_KEY_REGEX,
} from '../../common/constants';
import { ErrorSendGrid } from '../../common/constants/errors';
import { ConflictError, ServerError } from '../../common/errors';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  private readonly defaultFromEmail: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly mailService: MailService,
    private readonly sendgridConfigService: SendgridConfigService,
  ) {
    if (this.sendgridConfigService.apiKey === SENDGRID_API_KEY_DISABLED) {
      return;
    }

    if (!SENDGRID_API_KEY_REGEX.test(this.sendgridConfigService.apiKey)) {
      throw new ConflictError(ErrorSendGrid.InvalidApiKey);
    }

    this.mailService.setApiKey(this.sendgridConfigService.apiKey);

    this.defaultFromEmail = this.sendgridConfigService.fromEmail;
    this.defaultFromName = this.sendgridConfigService.fromName;
  }

  async sendEmail({
    from = {
      email: this.defaultFromEmail,
      name: this.defaultFromName,
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
      this.logger.error(error, SendGridService.name);
      throw new ServerError(ErrorSendGrid.EmailNotSent);
    }
  }
}
