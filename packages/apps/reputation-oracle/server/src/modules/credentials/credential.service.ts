import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateCredentialDto } from './credential.dto';
import { CredentialRepository } from './credential.repository';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { Web3Service } from '../web3/web3.service';
import { verifySignature } from '../../common/utils/signature';
import { ErrorAuth } from '../../common/constants/errors';
import { ChainId, KVStoreClient, EscrowClient } from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { UserType } from '../../common/enums/user';
import { UserService } from '../user/user.service';

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
        throw new Error('ExpiresAt must be after StartsAt.');
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
  ): Promise<any[]> {
    let query = this.credentialRepository.createQueryBuilder('credential');

    if (reference) {
      query = query.andWhere('credential.reference = :reference', {
        reference,
      });
    }

    if (status) {
      query = query.andWhere('credential.status = :status', { status });
    }

    if (user.role === UserType.WORKER) {
      query = query
        .leftJoinAndSelect('credential.validations', 'validation')
        .leftJoinAndSelect('validation.user', 'user')
        .andWhere('user.id = :userId', { userId: user.id });
    }

    try {
      const credentials = await query.getMany();

      if (user.role === UserType.CREDENTIAL_VALIDATOR) {
        return credentials.filter(
          (credential) =>
            credential.status === CredentialStatus.ACTIVE ||
            credential.status === CredentialStatus.EXPIRED,
        );
      } else if (user.role === UserType.WORKER) {
        return credentials.map((credential) => {
          const validation = credential.validations.find(
            (v) => v.user.id === user.id,
          );
          return {
            ...credential,
            certificate: validation ? validation.certificate : null,
          };
        });
      } else {
        throw new UnauthorizedException('Invalid user role');
      }
    } catch (error) {
      this.logger.error(`Failed to fetch credentials: ${error.message}`);
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }
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

  public async validateCredential(reference: string): Promise<void> {
    const credential =
      await this.credentialRepository.findByReference(reference);

    if (!credential) {
      throw new Error('Credential not found.');
    }

    if (credential.status !== CredentialStatus.ACTIVE) {
      throw new Error('Credential is not in a valid state for validation.');
    }
    credential.status = CredentialStatus.VALIDATED;
    await this.credentialRepository.save(credential);

    this.logger.log(`Credential ${reference} validated successfully.`);
  }

  public async addCredentialOnChain(
    reference: string,
    workerAddress: string,
    signature: string,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    let signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const reputationOracleAddress =
      await escrowClient.getReputationOracleAddress(escrowAddress);

    const signatureBody = await this.userService.prepareSignatureBody(
      SignatureType.CERTIFICATE_AUTHENTICATION,
      reputationOracleAddress,
      {
        reference: reference,
        workerAddress: workerAddress,
      },
    );

    if (!verifySignature(signatureBody.contents, signature, [workerAddress])) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
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
    const key = `${reference}-${reputationOracleAddress}`;
    const value = JSON.stringify({
      signature,
      contents: signatureBody.contents,
    });

    await kvstore.set(key, value);

    this.logger.log(
      `Credential added to the blockchain for reference: ${reference}`,
    );
  }
}
