import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The private key used for signing transactions.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow<string>('WEB3_PRIVATE_KEY');
  }
}
