import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { CredentialEntity } from './credential.entity';

@Injectable()
export class CredentialRepository extends BaseRepository<CredentialEntity> {
  private readonly logger = new Logger(CredentialRepository.name);

  constructor(private dataSource: DataSource) {
    super(CredentialEntity, dataSource);
  }

  async findByReference(reference: string): Promise<CredentialEntity | null> {
    const credentialEntity = this.findOne({ where: { reference } });
    return credentialEntity;
  }

  async getCredentials(status?: string): Promise<CredentialEntity[]> {
    let queryBuilder = this.createQueryBuilder('credential');
    if (status) {
      queryBuilder = queryBuilder.where('credential.status = :status', {
        status,
      });
    }
    const credentials = await queryBuilder.getMany();
    return credentials;
  }
}
