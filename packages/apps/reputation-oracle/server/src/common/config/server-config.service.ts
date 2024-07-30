import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }
  get port(): number {
    return +this.configService.get<number>('PORT', 5003);
  }
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3001');
  }
  get sessionSecret(): string {
    return this.configService.get<string>('SESSION_SECRET', 'session_key');
  }
  get maxRetryCount(): number {
    return +this.configService.get<number>('MAX_RETRY_COUNT', 5);
  }
  get qualificationMinValidity(): number {
    return +this.configService.get<number>('QUALIFICATION_MIN_VALIDITY', 1);
  }
}
