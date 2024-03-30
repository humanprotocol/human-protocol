import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { SENDGRID_API_KEY_REGEX } from '../../common/constants';
import { ErrorSendGrid } from '../../common/constants/errors';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  private readonly defaultFromEmail: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly mailService: MailService,
    private readonly sendgridConfigService: SendgridConfigService,
  ) {
    const apiKey = this.sendgridConfigService.apiKey;

    if (!SENDGRID_API_KEY_REGEX.test(apiKey)) {
      throw new Error(ErrorSendGrid.InvalidApiKey);
    }

    this.mailService.setApiKey(apiKey);

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
      throw new BadRequestException(ErrorSendGrid.EmailNotSent);
    }
  }
}
