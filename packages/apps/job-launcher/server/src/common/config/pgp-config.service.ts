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
    return this.configService.get<boolean>('PGP_ENCRYPT', false);
  }

  /**
   * The private key used for PGP encryption or decryption.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow<string>('PGP_PRIVATE_KEY');
  }

  /**
   * The passphrase associated with the PGP private key.
   * Required
   */
  get passphrase(): string {
    return this.configService.getOrThrow<string>('PGP_PASSPHRASE');
  }
}
