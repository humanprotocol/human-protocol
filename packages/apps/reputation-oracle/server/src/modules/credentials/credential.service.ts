import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { CreateCredentialDto } from './credential.dto';
import { CredentialRepository } from './credential.repository';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { Web3Service } from '../web3/web3.service';
import { verifySignature } from '../../common/utils/signature';
import { ChainId, KVStoreClient, EscrowClient } from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { UserService } from '../user/user.service';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class CredentialService {
  private readonly logger = new Logger(CredentialService.name);

  constructor(
    private readonly credentialRepository: CredentialRepository,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  public async createCredential(
    createCredentialDto: CreateCredentialDto,
  ): Promise<CredentialEntity> {
    const newCredential = new CredentialEntity();
    newCredential.reference = createCredentialDto.reference;
    newCredential.description = createCredentialDto.description;
    newCredential.url = createCredentialDto.url;
    newCredential.startsAt = new Date(createCredentialDto.startsAt);
    if (createCredentialDto.expiresAt) {
      const providedExpiresAt = new Date(createCredentialDto.expiresAt);
      if (providedExpiresAt <= newCredential.startsAt) {
        throw new ControlledError(
          'ExpiresAt must be after StartsAt.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        newCredential.expiresAt = providedExpiresAt;
      }
    }
    newCredential.status = CredentialStatus.ACTIVE;
    await this.credentialRepository.save(newCredential);
    return newCredential;
  }

  public async getCredentials(
    user: any,
    status?: string,
    reference?: string,
  ): Promise<CredentialEntity[]> {
    return await this.credentialRepository.findCredentials(
      user,
      status,
      reference,
    );
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

  public async validateCredential(
    reference: string,
    workerAddress: string,
  ): Promise<void> {
    const credential =
      await this.credentialRepository.findByReference(reference);

    if (!credential) {
      throw new ControlledError(
        'Credential not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (credential.status !== CredentialStatus.ACTIVE) {
      throw new ControlledError(
        'Credential is not in a valid state for validation.',
        HttpStatus.BAD_REQUEST,
      );
    }

    credential.status = CredentialStatus.VALIDATED;
    await this.credentialRepository.save(credential);

    this.logger.log(`Credential ${reference} validated successfully.`);
  }

  public async addCredentialOnChain(
    credential_id: number,
    workerAddress: string,
    signature: string,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const credential = await this.credentialRepository.findOne({
      where: { id: credential_id },
      relations: ['validator'],
    });

    if (!credential) {
      throw new ControlledError('Credential not found', HttpStatus.NOT_FOUND);
    }

    if (credential.status !== CredentialStatus.VALIDATED) {
      throw new ControlledError(
        'Credential is not in a valid state for on-chain addition.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const reputationOracleAddress =
      await escrowClient.getReputationOracleAddress(escrowAddress);

    const signatureBody = await this.userService.prepareSignatureBody(
      SignatureType.CERTIFICATE_AUTHENTICATION,
      reputationOracleAddress,
      { reference: credential.reference, workerAddress },
    );

    if (!verifySignature(signatureBody.contents, signature, [workerAddress])) {
      throw new ControlledError('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON);
    } else if (currentWeb3Env === Web3Env.TESTNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON_AMOY);
    } else {
      signer = this.web3Service.getSigner(ChainId.LOCALHOST);
    }

    const kvstore = await KVStoreClient.build(signer);
    const key = `${credential.reference}-${reputationOracleAddress}`;
    const value = JSON.stringify({
      signature,
      contents: signatureBody.contents,
    });

    await kvstore.set(key, value);

    credential.status = CredentialStatus.ON_CHAIN;
    await this.credentialRepository.save(credential);

    this.logger.log(
      `Credential added to the blockchain for ID: ${credential_id}`,
    );
  }
}
