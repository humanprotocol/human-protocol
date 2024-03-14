import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PGPConfigService {
  constructor(private configService: ConfigService) {}
  get encrypt(): boolean {
    return this.configService.get<string>('PGP_ENCRYPT', 'false') === 'true';
  }
  get privateKey(): string {
    return this.configService.get<string>('PGP_PRIVATE_KEY', '');
  }
  get passphrase(): string {
    return this.configService.get<string>('PGP_PASSPHRASE', '');
  }
}
