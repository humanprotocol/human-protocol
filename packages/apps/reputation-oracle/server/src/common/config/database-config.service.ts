import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}
  get url(): string | undefined {
    return this.configService.get<string>('POSTGRES_URL');
  }
  get host(): string {
    return this.configService.get<string>('POSTGRES_HOST', '127.0.0.1');
  }
  get port(): number {
    return +this.configService.get<number>('POSTGRES_PORT', 5432);
  }
  get user(): string {
    return this.configService.get<string>('POSTGRES_USER', 'operator');
  }
  get password(): string {
    return this.configService.get<string>('POSTGRES_PASSWORD', 'qwerty');
  }
  get database(): string {
    return this.configService.get<string>(
      'POSTGRES_DATABASE',
      'reputation-oracle',
    );
  }
  get ssl(): boolean {
    return this.configService.get<string>('POSTGRES_SSL', 'false') === 'true';
  }
  get logging(): string {
    return this.configService.get<string>('POSTGRES_LOGGING', '');
  }
}
