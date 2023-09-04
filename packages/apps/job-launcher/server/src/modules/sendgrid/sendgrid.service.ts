import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { ConfigNames } from '../../common/config';
import { SENDGRID_API_KEY_REGEX } from '../../common/constants';
import { ErrorSendGrid } from '../../common/constants/errors';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  private readonly defaultFromEmail: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>(
      ConfigNames.SENDGRID_API_KEY,
    )!;

    if (!SENDGRID_API_KEY_REGEX.test(apiKey)) {
      throw new Error(ErrorSendGrid.InvalidApiKey);
    }

    this.mailService.setApiKey(apiKey);

    this.defaultFromEmail = this.configService.get<string>(
      ConfigNames.SENDGRID_FROM_EMAIL,
    )!;
    this.defaultFromName = this.configService.get<string>(
      ConfigNames.SENDGRID_FROM_NAME,
    )!;
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
      return;
    } catch (error) {
      this.logger.error(error, SendGridService.name);
      throw new BadRequestException(ErrorSendGrid.EmailNotSent);
    }
  }
}
