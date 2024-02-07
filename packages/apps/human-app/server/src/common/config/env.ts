import Joi from 'joi';
import { ConfigService } from '@nestjs/config';

export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }
  get port(): string {
    return this.configService.get<string>('PORT', '5010');
  }
}

export const envValidator = Joi.object({
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5010),
  REPUTATION_ORACLE_URL: Joi.string().required(),
});
