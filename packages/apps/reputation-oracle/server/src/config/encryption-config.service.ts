import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * 32-byte key for AES encrpytion
   */
  get aesEncryptionKey(): string {
    return this.configService.getOrThrow('AES_ENCRYPTION_KEY');
  }
}
