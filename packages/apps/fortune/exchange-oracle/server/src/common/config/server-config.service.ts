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
    return +this.configService.get<number>('PORT', 5001);
  }
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3006');
  }
  get maxRetryCount(): number {
    return +this.configService.get<number>('MAX_RETRY_COUNT', 5);
  }
}
