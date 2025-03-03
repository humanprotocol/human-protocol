import { EmailAction } from './constants';

export abstract class EmailService {
  abstract sendEmail(
    to: string,
    action: EmailAction,
    payload?: Record<string, any>,
  ): Promise<void>;
}
