import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}
  get url(): string | undefined {
    return this.configService.get<string>('POSTGRES_URL');
  }
  get host(): string | undefined {
    return this.configService.get<string>('POSTGRES_HOST');
  }
  get port(): number | undefined {
    return this.configService.get<number>('POSTGRES_PORT');
  }
  get user(): string | undefined {
    return this.configService.get<string>('POSTGRES_USER');
  }
  get password(): string | undefined {
    return this.configService.get<string>('POSTGRES_PASSWORD');
  }
  get database(): string | undefined {
    return this.configService.get<string>(
      'POSTGRES_DATABASE',
      'exchange-oracle',
    );
  }
  get ssl(): boolean {
    return this.configService.get<string>('POSTGRES_SSL', 'false') === 'true';
  }
  get logging(): string {
    return this.configService.get<string>('POSTGRES_LOGGING', '');
  }
}
