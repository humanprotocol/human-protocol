import Joi from 'joi';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TestEnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get e2eTestingEmailAddress(): string {
    return this.configService.get<string>('E2E_TESTING_EMAIL_ADDRESS', '');
  }
  get e2eTestingPassword(): string {
    return this.configService.get<string>('E2E_TESTING_PASSWORD', '');
  }
}

export const testEnvValidator = Joi.object({
  E2E_TESTING_EMAIL_ADDRESS: Joi.string().required(),
  E2E_TESTING_PASSWORD: Joi.string().required(),
});
