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
        now.getTime() + this.serverConfigService.qualificationMinValidity,
      );

      if (providedExpiresAt <= minimumValidUntil) {
        this.logger.log(
          ErrorQualification.InvalidExpiresAt,
          QualificationService.name,
        );
        throw new ControlledError(
          ErrorQualification.InvalidExpiresAt,
          HttpStatus.BAD_REQUEST,
        );
      } else {
        newQualification.expiresAt = providedExpiresAt;
      }
    }

    try {
      await this.qualificationRepository.save(newQualification);
      return {
        reference: newQualification.reference,
        title: newQualification.title,
        description: newQualification.description,
        expiresAt: newQualification.expiresAt || null,
      };
    } catch (e) {
      this.logger.log(ErrorQualification.NotCreated, QualificationService.name);
      throw new ControlledError(
        ErrorQualification.NotCreated,
        HttpStatus.BAD_REQUEST,
      );
    }
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
          expiresAt: qualificationEntity.expiresAt || null,
        };
      });
    } catch (error) {
      this.logger.log(`Failed to fetch qualifications: ${error.message}`);
      return [];
    }
  }

  async delete(reference: string): Promise<void> {
    const result = await this.qualificationRepository.delete({ reference });
    if (result.affected === 0) {
      this.logger.log(`Qualification with reference "${reference}" not found`);
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  public async assign(dto: AssignQualificationDto): Promise<void> {
    const { reference, workerAddresses, workerEmails } = dto;

    const qualification = await this.qualificationRepository.findOne({
      where: { reference },
      relations: ['users'],
    });

    if (!qualification) {
      this.logger.log(`Qualification with reference "${reference}" not found`);
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const users = await this.getWorkers(workerAddresses, workerEmails);

    qualification.users.push(...users);
    await this.qualificationRepository.save(qualification);
  }

  public async unassign(dto: UnassignQualificationDto): Promise<void> {
    const { reference, workerAddresses, workerEmails } = dto;

    const qualification = await this.qualificationRepository.findOne({
      where: { reference },
      relations: ['users'],
    });

    if (!qualification) {
      this.logger.log(`Qualification with reference "${reference}" not found`);
      throw new ControlledError(
        ErrorQualification.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const users = await this.getWorkers(workerAddresses, workerEmails);

    qualification.users = qualification.users.filter(
      (user) => !users.some((u) => u.id === user.id),
    );

    await this.qualificationRepository.save(qualification);
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
      const addressUsers = await this.userRepository.find({
        where: addresses.map((address) => ({
          evmAddress: address,
          role: Role.WORKER,
          status: UserStatus.ACTIVE,
        })),
      });
      users.push(...addressUsers);
    } else if (emails && emails.length > 0) {
      const emailUsers = await this.userRepository.find({
        where: emails.map((email) => ({
          email,
          role: Role.WORKER,
          status: UserStatus.ACTIVE,
        })),
      });
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
