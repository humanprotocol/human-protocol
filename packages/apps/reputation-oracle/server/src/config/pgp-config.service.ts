import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PGPConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Indicates whether PGP encryption should be used.
   * Default: false
   */
  get encrypt(): boolean {
    return this.configService.get('PGP_ENCRYPT', 'false') === 'true';
  }

  /**
   * The private key used for PGP encryption or decryption.
   */
  get privateKey(): string {
    return this.configService.getOrThrow('PGP_PRIVATE_KEY');
  }

  /**
   * The passphrase associated with the PGP private key.
   */
  get passphrase(): string {
    return this.configService.getOrThrow('PGP_PASSPHRASE');
  }
}
