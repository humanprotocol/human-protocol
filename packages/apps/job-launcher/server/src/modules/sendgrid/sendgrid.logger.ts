import { Logger } from '@nestjs/common';
import { SendGridConstants } from './sendgrid.constants';

export const logger = new Logger(SendGridConstants.SENDGRID_MODULE);
