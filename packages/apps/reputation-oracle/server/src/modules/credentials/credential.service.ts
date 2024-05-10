import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateCredentialDto } from './credential.dto';
import { CredentialRepository } from './credential.repository';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { Web3Service } from '../web3/web3.service';
import { verifySignature } from '../../common/utils/signature';
import { ErrorAuth, ErrorCredential } from '../../common/constants/errors';
import { Signature, Wallet } from 'ethers';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';

@Injectable()
export class CredentialService {
  private readonly logger = new Logger(CredentialService.name);

  constructor(
    private readonly credentialRepository: CredentialRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Create a new credential based on provided data.
   * @param createCredentialDto Data needed to create the credential.
   * @returns The created credential entity.
   */
  public async createCredential(
    createCredentialDto: CreateCredentialDto,
  ): Promise<CredentialEntity> {
    this.logger.log('Creating a new credential');
    return this.credentialRepository.create(createCredentialDto);
  }

  public async getByReference(
    reference: string,
  ): Promise<CredentialEntity | null> {
    const credentialEntity =
      await this.credentialRepository.findByReference(reference);

    if (
      !credentialEntity ||
      CredentialStatus.EXPIRED === credentialEntity.status
    ) {
      return null;
    }

    return credentialEntity;
  }

  private validateCredentialData(
    credential: CredentialEntity,
    reference: string,
    workerAddress: string,
  ): boolean {
    if (!credential || credential.status !== CredentialStatus.ACTIVE) {
      return false;
    }

    const currentDate = new Date();
    if (credential.expiresAt && currentDate > credential.expiresAt) {
      return false;
    }

    const signedData = this.web3Service.prepareSignatureBody(
      SignatureType.CERTIFICATE_AUTHENTICATION,
      credential.reputationOracleAddress,
    );
  }

  public async addCredentialOnChain(
    reference: string,
    reputationOracleAddress: string,
    signature: string,
  ): Promise<void> {
    const signedData = this.web3Service.prepareSignatureBody(
      SignatureType.CERTIFICATE_AUTHENTICATION,
      reputationOracleAddress,
    );

    const verified = verifySignature(signedData, signature, [
      reputationOracleAddress,
    ]);
    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

    let signer: Wallet;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON);
    } else if (currentWeb3Env === Web3Env.TESTNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON_AMOY);
    } else {
      signer = this.web3Service.getSigner(ChainId.LOCALHOST);
    }

    const kvstore = await KVStoreClient.build(signer);

    const key = `${reference}-${reputationOracleAddress}`;
    await kvstore.set(key, signature);

    this.logger.log(
      `Credential added to the blockchain for reference: ${reference}`,
    );
  }
}
