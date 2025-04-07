import {
  ChainId,
  Encryption,
  EncryptionUtils,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { PGPConfigService } from '../../config/pgp-config.service';
import logger from '../../logger';

import { Web3Service } from '../web3/web3.service';

@Injectable()
export class PgpEncryptionService implements OnModuleInit {
  private readonly logger = logger.child({
    context: PgpEncryptionService.name,
  });

  private sdkInstance: Encryption;

  constructor(
    private readonly pgpConfigService: PGPConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  async onModuleInit(): Promise<void> {
    this.sdkInstance = await Encryption.build(
      this.pgpConfigService.privateKey,
      this.pgpConfigService.passphrase,
    );
  }

  /**
   * Checks if file content is PGP-encrypted and decrypts it
   * using Reputation Oracle PGP key, otherwise returns as is.
   */
  async maybeDecryptFile(fileContent: Buffer): Promise<Buffer> {
    const contentAsString = fileContent.toString();
    if (!EncryptionUtils.isEncrypted(contentAsString)) {
      return fileContent;
    }

    const decryptedData = await this.sdkInstance.decrypt(contentAsString);

    return Buffer.from(decryptedData);
  }

  /**
   * Encrypts content using PGP public keys of provided oracles.
   * Always uses Reputation Oracle key in addition to provided list.
   */
  async encrypt(
    content: string | Buffer,
    chainId: ChainId,
    oracleAddresses: string[] = [],
  ): Promise<string> {
    if (!this.pgpConfigService.encrypt) {
      return content.toString();
    }

    const addresses = Array.from(
      new Set([
        ...oracleAddresses,
        this.web3Service.getSigner(chainId).address,
      ]),
    );

    const publicKeys = await Promise.all(
      addresses.map((address) =>
        this.getPgpPublicKeyForOracle(chainId, address),
      ),
    );

    return EncryptionUtils.encrypt(content, publicKeys);
  }

  private async getPgpPublicKeyForOracle(
    chainId: ChainId,
    oracleAddress: string,
  ): Promise<string> {
    try {
      const pgpPublicKey = await KVStoreUtils.getPublicKey(
        chainId,
        oracleAddress,
      );
      if (!pgpPublicKey) {
        throw new Error('Public key is missing');
      }

      return pgpPublicKey;
    } catch (error) {
      const errorMessage = 'Failed to get PGP public key for oracle';
      this.logger.error(errorMessage, {
        chainId,
        oracleAddress,
        detail: error.message,
      });
      throw new Error(errorMessage);
    }
  }
}
