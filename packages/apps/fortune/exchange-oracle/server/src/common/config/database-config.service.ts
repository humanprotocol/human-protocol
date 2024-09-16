import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The URL for connecting to the PostgreSQL database.
   * Required
   */
  get url(): string | undefined {
    return this.configService.get<string>('POSTGRES_URL');
  }

  /**
   * The hostname or IP address of the PostgreSQL database server.
   * Required
   */
  get host(): string | undefined {
    return this.configService.get<string>('POSTGRES_HOST');
  }

  /**
   * The port number on which the PostgreSQL database server is listening.
   * Required
   */
  get port(): number | undefined {
    return this.configService.get<number>('POSTGRES_PORT');
  }

  /**
   * The username for authenticating with the PostgreSQL database.
   * Required
   */
  get user(): string | undefined {
    return this.configService.get<string>('POSTGRES_USER');
  }

  /**
   * The password for authenticating with the PostgreSQL database.
   * Required
   */
  get password(): string | undefined {
    return this.configService.get<string>('POSTGRES_PASSWORD');
  }

  /**
   * The name of the PostgreSQL database to connect to.
   * Default: 'exchange-oracle'
   */
  get database(): string | undefined {
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
   * Required
   */
  get logging(): string {
    return this.configService.getOrThrow<string>('POSTGRES_LOGGING');
  }
}
