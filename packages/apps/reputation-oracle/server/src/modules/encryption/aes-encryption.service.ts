import crypto from 'crypto';

import { Injectable } from '@nestjs/common';

import { EncryptionConfigService } from '@/config';
import logger from '@/logger';

const ALGORITHM = 'aes-256-gcm';
const GCM_IV_LENGTH_BYTES = 12;

type EncryptionOutput = {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
};

@Injectable()
export class AesEncryptionService {
  private readonly logger = logger.child({
    context: AesEncryptionService.name,
  });

  constructor(
    private readonly encryptionConfigService: EncryptionConfigService,
  ) {}

  private composeEnvelopeString({
    encrypted,
    authTag,
    iv,
  }: EncryptionOutput): string {
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
  }

  private parseEnvelopeString(envelope: string): EncryptionOutput {
    const [iv, encrypted, authTag] = envelope.split(':');

    if (!iv || !encrypted || !authTag) {
      throw new Error('Invalid AES envelope');
    }

    return {
      iv: Buffer.from(iv, 'hex'),
      encrypted: Buffer.from(encrypted, 'hex'),
      authTag: Buffer.from(authTag, 'hex'),
    };
  }

  async encrypt(data: Buffer): Promise<string> {
    const encryptionKey = this.encryptionConfigService.aesEncryptionKey;

    const iv = crypto.randomBytes(GCM_IV_LENGTH_BYTES);

    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey),
      iv,
    );

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return this.composeEnvelopeString({
      iv,
      encrypted,
      authTag,
    });
  }

  async decrypt(envelope: string): Promise<Buffer> {
    const { iv, encrypted, authTag } = this.parseEnvelopeString(envelope);

    const encryptionKey = this.encryptionConfigService.aesEncryptionKey;

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey),
      iv,
    );
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted;
  }
}
