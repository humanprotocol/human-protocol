import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

import { ServerConfigService } from '../../config';
import logger from '../../logger';
import { UserRepository, UserStatus } from '../user';

import { QualificationEntity } from './qualification.entity';
import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
import { QualificationRepository } from './qualification.repository';
import { UserQualificationEntity } from './user-qualification.entity';
import { UserQualificationRepository } from './user-qualification.repository';

type Qualification = {
  reference: string;
  title: string;
  description: string;
  expiresAt?: string;
};

@Injectable()
export class QualificationService {
  private readonly logger = logger.child({
    context: QualificationService.name,
  });

  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userQualificationRepository: UserQualificationRepository,
    private readonly userRepository: UserRepository,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  async createQualification(qualification: {
    title: string;
    description: string;
    expiresAt?: Date;
  }): Promise<Qualification> {
    const newQualification = new QualificationEntity();
    newQualification.reference = uuidV4();
    newQualification.title = qualification.title;
    newQualification.description = qualification.description;

    if (qualification.expiresAt) {
      const now = Date.now();
      const minimumValidUntil = new Date(
        now + this.serverConfigService.qualificationMinValidity,
      );

      if (qualification.expiresAt <= minimumValidUntil) {
        const errorMessage =
          QualificationErrorMessage.INVALID_EXPIRATION_TIME.replace(
            '%minExpirationDate%',
            minimumValidUntil.toISOString(),
          );
        throw new QualificationError(errorMessage as QualificationErrorMessage);
      }
      newQualification.expiresAt = qualification.expiresAt;
    }

    await this.qualificationRepository.createUnique(newQualification);
    return {
      reference: newQualification.reference,
      title: newQualification.title,
      description: newQualification.description,
      expiresAt: newQualification.expiresAt?.toISOString(),
    };
  }

  async getQualifications(): Promise<Qualification[]> {
    try {
      const qualificationEntities =
        await this.qualificationRepository.getActiveQualifications();

      return qualificationEntities.map((qualificationEntity) => {
        return {
          reference: qualificationEntity.reference,
          title: qualificationEntity.title,
          description: qualificationEntity.description,
          expiresAt: qualificationEntity.expiresAt?.toISOString(),
        };
      });
    } catch (error) {
      this.logger.warn('Failed to fetch qualifications', error);
      return [];
    }
  }

  async deleteQualification(reference: string): Promise<void> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    const userQualifications =
      await this.userQualificationRepository.findByQualification(
        qualificationEntity.id,
      );
    if (userQualifications.length > 0) {
      throw new QualificationError(
        QualificationErrorMessage.CANNOT_DETELE_ASSIGNED_QUALIFICATION,
        reference,
      );
    }

    await this.qualificationRepository.deleteOne(qualificationEntity);
  }

  async assign(
    reference: string,
    workerAddresses: string[],
  ): Promise<{
    success: string[];
    failed: { evmAddress: string; reason: string }[];
  }> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    const users =
      await this.userRepository.findWorkersByAddresses(workerAddresses);

    if (users.length === 0) {
      throw new QualificationError(
        QualificationErrorMessage.NO_WORKERS_FOUND,
        reference,
      );
    }

    const result = {
      success: [] as string[],
      failed: [] as { evmAddress: string; reason: string }[],
    };

    for (const user of users) {
      try {
        if (user.status !== UserStatus.ACTIVE) {
          throw new Error('User is not in active status');
        }
        const userQualification = new UserQualificationEntity();
        userQualification.qualificationId = qualificationEntity.id;
        userQualification.userId = user.id;

        await this.userQualificationRepository.createUnique(userQualification);

        result.success.push(user.evmAddress as string);
      } catch (error) {
        this.logger.error('Cannot assign user to qualification', {
          user: user.id,
          qualification: reference,
          reason: error.message,
        });

        result.failed.push({
          evmAddress: user.evmAddress as string,
          reason: error.message,
        });
      }
    }
    return result;
  }

  async unassign(
    reference: string,
    workerAddresses: string[],
  ): Promise<{
    success: string[];
    failed: { evmAddress: string; reason: string }[];
  }> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    const users =
      await this.userRepository.findWorkersByAddresses(workerAddresses);

    if (users.length === 0) {
      throw new QualificationError(
        QualificationErrorMessage.NO_WORKERS_FOUND,
        reference,
      );
    }

    const result = {
      success: [] as string[],
      failed: [] as { evmAddress: string; reason: string }[],
    };

    for (const user of users) {
      try {
        await this.userQualificationRepository.removeByUserAndQualification(
          user.id,
          qualificationEntity.id,
        );
        result.success.push(user.evmAddress as string);
      } catch (error) {
        this.logger.error('Cannot unassign user from qualification', {
          user: user.id,
          qualification: reference,
          reason: error.message,
        });
        result.failed.push({
          evmAddress: user.evmAddress as string,
          reason: error.message,
        });
      }
    }

    return result;
  }
}
