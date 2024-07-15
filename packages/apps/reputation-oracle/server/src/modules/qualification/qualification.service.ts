import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
  QualificationDto,
} from './qualification.dto';
import { QualificationEntity } from './qualification.entity';
import { ErrorQualification } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { QualificationRepository } from './qualification.repository';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';
import { UserStatus, Role } from '../../common/enums/user';
import { UserQualificationEntity } from './user-qualification.entity';
import { ServerConfigService } from '../../common/config/server-config.service';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

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
      const providedExpiresAt = new Date(createQualificationDto.expiresAt);
      const now = new Date();
      const minimumValidUntil = new Date(
        now.getTime() +
          this.serverConfigService.qualificationMinValidity * 60 * 60 * 1000, // Convert hours to milliseconds,
      );

      if (providedExpiresAt <= minimumValidUntil) {
        const minValidityHours =
          this.serverConfigService.qualificationMinValidity;
        const errorMessage = ErrorQualification.InvalidExpiresAt.replace(
          '%minValidity%',
          minValidityHours.toString(),
        );

        this.logger.log(errorMessage, QualificationService.name);
        throw new ControlledError(errorMessage, HttpStatus.BAD_REQUEST);
      } else {
        newQualification.expiresAt = providedExpiresAt;
      }
    }

    await this.qualificationRepository.createUnique(newQualification);
    return {
      reference: newQualification.reference,
      title: newQualification.title,
      description: newQualification.description,
      expiresAt: newQualification.expiresAt || null,
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
          expiresAt: qualificationEntity.expiresAt,
        };
      });
    } catch (error) {
      this.logger.log(`Failed to fetch qualifications: ${error.message}`);
      return [];
    }
  }

  async delete(reference: string): Promise<void> {
    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.qualificationRepository.deleteOne(qualificationEntity);
  }

  public async assign(dto: AssignQualificationDto): Promise<void> {
    const { reference, workerAddresses, workerEmails } = dto;

    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      this.logger.log(`Qualification with reference "${reference}" not found`);
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const users = await this.getWorkers(workerAddresses, workerEmails);

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

  public async unassign(dto: UnassignQualificationDto): Promise<void> {
    const { reference, workerAddresses, workerEmails } = dto;

    const qualificationEntity =
      await this.qualificationRepository.findByReference(reference);

    if (!qualificationEntity) {
      this.logger.log(`Qualification with reference "${reference}" not found`);
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const users = await this.getWorkers(workerAddresses, workerEmails);
    await this.qualificationRepository.removeUserQualifications(
      users,
      qualificationEntity,
    );
  }

  public async getWorkers(
    addresses?: string[],
    emails?: string[],
  ): Promise<UserEntity[]> {
    if (
      (!addresses || addresses.length === 0) ===
      (!emails || emails.length === 0)
    ) {
      throw new ControlledError(
        ErrorQualification.AddressesOrEmailsMustBeProvided,
        HttpStatus.BAD_REQUEST,
      );
    }

    const users: UserEntity[] = [];

    if (addresses && addresses.length > 0) {
      const addressUsers = await this.userRepository.findByAddress(
        addresses,
        Role.WORKER,
        UserStatus.ACTIVE,
      );
      users.push(...addressUsers);
    } else if (emails && emails.length > 0) {
      const emailUsers = await this.userRepository.findByEmail(
        emails,
        Role.WORKER,
        UserStatus.ACTIVE,
      );
      users.push(...emailUsers);
    }

    if (users.length === 0) {
      throw new ControlledError(
        ErrorQualification.NoWorkersFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return users;
  }
}
