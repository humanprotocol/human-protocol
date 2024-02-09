import Joi from 'joi';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }
  get port(): string {
    return this.configService.get<string>('PORT', '5010');
  }
  get reputationOracleUrl(): string {
    return this.configService.get<string>('REPUTATION_ORACLE_URL', '');
  }
  get e2eTestingEmailAddress(): string {
    return this.configService.get<string>('E2E_TESTING_EMAIL_ADDRESS', '');
  }
  get e2eTestingPassword(): string {
    return this.configService.get<string>('E2E_TESTING_PASSWORD', '');
  }
}

export const envValidator = Joi.object({
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5010),
  REPUTATION_ORACLE_URL: Joi.string().required(),
  E2E_TESTING_EMAIL_ADDRESS: Joi.string().required(),
  E2E_TESTING_PASSWORD: Joi.string().required(),
});
