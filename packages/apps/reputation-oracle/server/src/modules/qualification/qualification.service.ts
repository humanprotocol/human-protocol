import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
} from './qualification.dto';
import { QualificationEntity } from './qualification.entity';
import { ErrorQualification } from 'src/common/constants/errors';
import { ControlledError } from 'src/common/errors/controlled';
import { QualificationRepository } from './qualification.repository';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    @InjectRepository(QualificationEntity)
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  public async createQualification(
    createQualificationDto: CreateQualificationDto,
  ): Promise<QualificationEntity> {
    const newQualification = new QualificationEntity();
    newQualification.reference = createQualificationDto.reference;
    newQualification.title = createQualificationDto.title;
    newQualification.description = createQualificationDto.description;

    if (createQualificationDto.expiresAt) {
      const providedExpiresAt = new Date(createQualificationDto.expiresAt);

      if (providedExpiresAt <= new Date()) {
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

    await this.qualificationRepository.save(newQualification);
    return newQualification;
  }

  public async getQualifications(): Promise<QualificationEntity[]> {
    try {
      return this.qualificationRepository.getQualifications();
    } catch (error) {
      this.logger.log(`Failed to fetch credentials: ${error.message}`);
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

  async assign(dto: AssignQualificationDto): Promise<void> {
    // Logic for assigning qualifications to users
  }

  async unassign(dto: UnassignQualificationDto): Promise<void> {
    // Logic for unassigning qualifications from users
  }
}
