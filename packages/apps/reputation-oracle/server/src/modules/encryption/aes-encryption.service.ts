import crypto from 'crypto';

import { Injectable } from '@nestjs/common';

import { EncryptionConfigService } from '@/config';
import logger from '@/logger';

const ALGORITHM = 'aes-256-gcm';
const GCM_IV_LENGTH_BYTES = 12;

/**
 * Security note:
 * - Best practice is to use one encryption key per purpose (e.g., exchange API keys, PII, etc.).
 * - At the moment, we only encrypt exchange API keys and therefore use a single key
 *   provided by EncryptionConfigService.aesEncryptionKey.
 * - If/when we start encrypting different kinds of data, we should switch to per-purpose keys:
 *   - add dedicated config entries for each purpose (e.g., ENCRYPTION_USER_EXCHANGE_API_KEY, ...),
 *   - update this service so encrypt/decrypt accept an explicit encryptionKey parameter,
 *   - and ensure callers pass the correct key for the data they are encrypting/decrypting.
 */

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
