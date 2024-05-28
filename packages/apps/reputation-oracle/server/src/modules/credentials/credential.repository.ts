import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import {
  CredentialEntity,
  CredentialValidationEntity,
} from './credential.entity';
import { UserType } from '../../common/enums/user';
import { CredentialStatus } from '../../common/enums/credential';
import { ControlledError } from '../../common/errors/controlled';

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

  async saveValidation(validation: CredentialValidationEntity): Promise<void> {
    await this.dataSource
      .getRepository(CredentialValidationEntity)
      .save(validation);
  }

  async findCredentials(
    user: any,
    status?: string,
    reference?: string,
  ): Promise<CredentialEntity[]> {
    let query = this.createQueryBuilder('credential');
    query = query.where('credential.userId = :userId', { userId: user.id });

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
        const credentialWithCertificate = new CredentialEntity();
        Object.assign(credentialWithCertificate, credential, {
          certificate: validation ? validation.certificate : null,
        });
        return credentialWithCertificate;
      });
    } else {
      throw new ControlledError('Invalid user role', HttpStatus.UNAUTHORIZED);
    }
  }
}
