import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';
import { SENDGRID_API_KEY_REGEX } from '../../common/constants';
import { ErrorSendGrid } from '../../common/constants/errors';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly sendgridConfigService: SendgridConfigService,
  ) {
    const apiKey = this.sendgridConfigService.apiKey;

    if (!SENDGRID_API_KEY_REGEX.test(apiKey)) {
      throw new Error(ErrorSendGrid.InvalidApiKey);
    }

    this.mailService.setApiKey(apiKey);
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
