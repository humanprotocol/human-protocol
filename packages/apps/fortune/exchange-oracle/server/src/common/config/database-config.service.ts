import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The URL for connecting to the PostgreSQL database.
   */
  get url(): string | undefined {
    return this.configService.get<string>('POSTGRES_URL');
  }

  /**
   * The hostname or IP address of the PostgreSQL database server.
   * Default: '127.0.0.1'
   */
  get host(): string {
    return this.configService.get<string>('POSTGRES_HOST', '127.0.0.1');
  }

  /**
   * The port number on which the PostgreSQL database server is listening.
   * Default: 5432
   */
  get port(): number {
    return +this.configService.get<number>('POSTGRES_PORT', 5432);
  }

  /**
   * The username for authenticating with the PostgreSQL database.
   * Default: 'operator'
   */
  get user(): string {
    return this.configService.get<string>('POSTGRES_USER', 'operator');
  }

  /**
   * The password for authenticating with the PostgreSQL database.
   * Default: 'qwerty'
   */
  get password(): string {
    return this.configService.get<string>('POSTGRES_PASSWORD', 'qwerty');
  }

  /**
   * The name of the PostgreSQL database to connect to.
   * Default: 'exchange-oracle'
   */
  get database(): string {
    return this.configService.get<string>(
      'POSTGRES_DATABASE',
      'exchange-oracle',
    );
  }

  /**
   * Indicates whether to use SSL for connections to the PostgreSQL database.
   * Default: false
   */
  get ssl(): boolean {
    return this.configService.get<string>('POSTGRES_SSL', 'false') === 'true';
  }

  /**
   * The logging level for PostgreSQL operations (e.g., 'debug', 'info').
   * Default: 'log,info,warn,error'
   */
  get logging(): string {
    return this.configService.get<string>('POSTGRES_LOGGING', 'log,info,warn,error');
  }
}
