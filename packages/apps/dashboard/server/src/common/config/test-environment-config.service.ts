import Joi from 'joi';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TestEnvironmentConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The email address used for end-to-end (E2E) testing.
   * Default: empty string
   */
  get e2eTestingEmailAddress(): string {
    return this.configService.get<string>('E2E_TESTING_EMAIL_ADDRESS', '');
  }
}

export const testEnvValidator = Joi.object({
  E2E_TESTING_EMAIL_ADDRESS: Joi.string().required(),
});
