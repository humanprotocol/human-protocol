import { Injectable, Logger } from '@nestjs/common';
import { CreateCredentialDto } from './credential.dto';
import { CredentialRepository } from './credential.repository';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';

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
}
