import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateCredentialDto } from './credential.dto';
import { CredentialRepository } from './credential.repository';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { Web3Service } from '../web3/web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { UserService } from '../user/user.service';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class CredentialService {
  private readonly logger = new Logger(CredentialService.name);

  constructor(private readonly credentialRepository: CredentialRepository) {}

  /**
   * Create a new credential based on provided data.
   * @param createCredentialDto Data needed to create the credential.
   * @returns The created credential entity.
   */
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
    await this.credentialRepository.createUnique(newCredential);
    return newCredential;
  }

  public async getCredentials(
    user: any,
    status?: string,
  ): Promise<CredentialEntity[]> {
    let query = this.credentialRepository.createQueryBuilder('credential');
    query = query.where('credential.userId = :userId', { userId: user.id });

    if (status) {
      query = query.andWhere('credential.status = :status', { status: status });
    }
    try {
      return query.getMany();
    } catch (error) {
      throw new ControlledError(
        `Failed to fetch credentials: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
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

  /**
   * Validate a credential based on provided data.
   * @param {string} reference - The unique reference of the credential.
   * @param {string} workerAddress - The address of the user that completed the training or activity.
   * @returns {Promise<void>}
   */
  public async validateCredential(reference: string): Promise<void> {
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
}
