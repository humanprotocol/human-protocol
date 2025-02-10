import { Injectable } from '@nestjs/common';
import { CreateQualificationDto, QualificationDto } from './qualification.dto';
import { QualificationEntity } from './qualification.entity';
import { QualificationRepository } from './qualification.repository';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';
import { UserStatus, Role } from '../../common/enums/user';
import { UserQualificationEntity } from './user-qualification.entity';
import { ServerConfigService } from '../../common/config/server-config.service';
import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
import logger from '../../logger';

@Injectable()
export class QualificationService {
  private readonly logger = logger.child({
    context: QualificationService.name,
  });

  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userRepository: UserRepository,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  public async createQualification(
    createQualificationDto: CreateQualificationDto,
  ): Promise<QualificationDto> {
    const newQualification = new QualificationEntity();
    newQualification.reference = createQualificationDto.reference;
    newQualification.title = createQualificationDto.title;
    newQualification.description = createQualificationDto.description;

    if (createQualificationDto.expiresAt) {
      const providedExpirationTime = new Date(createQualificationDto.expiresAt);
      const now = new Date();
      const minimumValidUntil = new Date(
        now.getTime() +
          this.serverConfigService.qualificationMinValidity *
            24 *
            60 *
            60 *
            1000, // Convert days to milliseconds,
      );

      if (providedExpirationTime <= minimumValidUntil) {
        const errorMessage =
          QualificationErrorMessage.INVALID_EXPIRATION_TIME.replace(
            '%minValidity%',
            this.serverConfigService.qualificationMinValidity.toString(),
          );
        throw new QualificationError(
          errorMessage as QualificationErrorMessage,
          createQualificationDto.reference,
        );
      } else {
        newQualification.expiresAt = providedExpirationTime;
      }
    }

    await this.qualificationRepository.createUnique(newQualification);
    return {
      reference: newQualification.reference,
      title: newQualification.title,
      description: newQualification.description,
      expiresAt: newQualification.expiresAt?.toISOString(),
    };
  }

  public async getQualifications(): Promise<QualificationDto[]> {
    try {
      const qualificationEntities =
        await this.qualificationRepository.getQualifications();

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

  async delete(reference: string): Promise<void> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    if (qualificationEntity.userQualifications.length > 0) {
      throw new QualificationError(
        QualificationErrorMessage.CANNOT_DETELE_ASSIGNED_QUALIFICATION,
        reference,
      );
    }

    await this.qualificationRepository.deleteOne(qualificationEntity);
  }

  public async assign(
    reference: string,
    workerAddresses: string[],
  ): Promise<void> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    const users = await this.getWorkers(workerAddresses);

    if (users.length === 0) {
      throw new QualificationError(
        QualificationErrorMessage.NO_WORKERS_FOUND,
        reference,
      );
    }

    const newUserQualifications = users
      .filter(
        (user) =>
          !qualificationEntity.userQualifications.some(
            (uq) => uq.user.id === user.id,
          ),
      )
      .map((user) => {
        const userQualification = new UserQualificationEntity();
        userQualification.user = user;
        userQualification.qualification = qualificationEntity;
        return userQualification;
      });

    await this.qualificationRepository.saveUserQualifications(
      newUserQualifications,
    );
  }

  public async unassign(
    reference: string,
    workerAddresses: string[],
  ): Promise<void> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new QualificationError(
        QualificationErrorMessage.NOT_FOUND,
        reference,
      );
    }

    const users = await this.getWorkers(workerAddresses);

    if (users.length === 0) {
      throw new QualificationError(
        QualificationErrorMessage.NO_WORKERS_FOUND,
        reference,
      );
    }

    await this.qualificationRepository.removeUserQualifications(
      users,
      qualificationEntity,
    );
  }

  // TODO: Move this method to the `user` module.
  public async getWorkers(addresses: string[]): Promise<UserEntity[]> {
    const users = await this.userRepository.findByAddress(
      addresses,
      Role.WORKER,
      UserStatus.ACTIVE,
    );

    return users;
  }
}
