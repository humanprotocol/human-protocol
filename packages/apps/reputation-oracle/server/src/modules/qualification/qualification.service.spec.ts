import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorQualification } from '../../common/constants/errors';
import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
} from './qualification.dto';
import { QualificationEntity } from './qualification.entity';
import { UserEntity } from '../user/user.entity';
import { UserQualificationEntity } from './user-qualification.entity';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ConfigService } from '@nestjs/config';

describe.only('QualificationService', () => {
  let qualificationService: QualificationService;
  let qualificationRepository: QualificationRepository;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        QualificationService,
        {
          provide: QualificationRepository,
          useValue: createMock<QualificationRepository>(),
        },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        ConfigService,
        ServerConfigService,
      ],
    }).compile();

    qualificationService =
      moduleRef.get<QualificationService>(QualificationService);
    qualificationRepository = moduleRef.get<QualificationRepository>(
      QualificationRepository,
    );
    userRepository = moduleRef.get<UserRepository>(UserRepository);
  });

  describe('createQualification', () => {
    it('should create a new qualification', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
        expiresAt: new Date('2025-12-31'),
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = createQualificationDto.reference;
      qualificationEntity.title = createQualificationDto.title;
      qualificationEntity.description = createQualificationDto.description;
      qualificationEntity.expiresAt = new Date(
        createQualificationDto.expiresAt!,
      );

      qualificationRepository.save = jest
        .fn()
        .mockResolvedValue(qualificationEntity);

      const result = await qualificationService.createQualification(
        createQualificationDto,
      );

      expect(result).toEqual({
        reference: createQualificationDto.reference,
        title: createQualificationDto.title,
        description: createQualificationDto.description,
        expiresAt: new Date(createQualificationDto.expiresAt!),
      });
    });

    it('should throw an error if the expiration date is in the past', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
        expiresAt: new Date('2000-01-01'),
      };

      const errorMessage = ErrorQualification.InvalidExpiresAt.replace(
        '%minValidity%',
        '1',
      );

      await expect(
        qualificationService.createQualification(createQualificationDto),
      ).rejects.toThrow(
        new ControlledError(errorMessage, HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an error if the qualification has not beed created', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
        expiresAt: new Date('2025-12-31'),
      };

      qualificationRepository.createUnique = jest
        .fn()
        .mockRejectedValueOnce(new Error());

      await expect(
        qualificationService.createQualification(createQualificationDto),
      ).rejects.toThrow(Error);
    });
  });

  describe('getQualifications', () => {
    it('should return a list of qualifications', async () => {
      const qualifications = [
        {
          reference: 'ref1',
          title: 'title1',
          description: 'desc1',
          expiresAt: null,
        },
      ];
      qualificationRepository.getQualifications = jest
        .fn()
        .mockResolvedValue(qualifications);

      const result = await qualificationService.getQualifications();

      expect(result).toEqual(qualifications);
    });
  });

  describe('delete', () => {
    it('should delete a qualification by reference', async () => {
      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = 'ref1';
      qualificationEntity.userQualifications = [];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);

      qualificationRepository.deleteOne = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(
        qualificationService.delete('ref1'),
      ).resolves.toBeUndefined();
    });

    it('should throw an error if the qualification is not found', async () => {
      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(qualificationService.delete('ref1')).rejects.toThrow(
        new ControlledError(ErrorQualification.NotFound, HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('assign', () => {
    beforeEach(() => {
      qualificationRepository.saveUserQualifications = jest.fn();
    });

    it('should assign users to a qualification', async () => {
      const assignQualificationDto: AssignQualificationDto = {
        reference: 'ref1',
        workerAddresses: ['address1'],
        workerEmails: ['email1@example.com'],
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = 'ref1';
      qualificationEntity.userQualifications = [];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      qualificationService.getWorkers = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.assign(assignQualificationDto);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the qualification is not found', async () => {
      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        qualificationService.assign({
          reference: 'ref1',
          workerAddresses: [],
          workerEmails: [],
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorQualification.NotFound, HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('unassign', () => {
    beforeEach(() => {
      qualificationRepository.saveUserQualifications = jest.fn();
    });

    it('should unassign users from a qualification', async () => {
      const unassignQualificationDto: UnassignQualificationDto = {
        reference: 'ref1',
        workerAddresses: ['address1'],
        workerEmails: ['email1@example.com'],
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = 'ref1';
      qualificationEntity.userQualifications = [
        { id: 1 } as UserQualificationEntity,
      ];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      qualificationService.getWorkers = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.unassign(unassignQualificationDto);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if the qualification is not found', async () => {
      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        qualificationService.unassign({
          reference: 'ref1',
          workerAddresses: [],
          workerEmails: [],
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorQualification.NotFound, HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getWorkers', () => {
    it('should throw an error if neither addresses nor emails are provided', async () => {
      await expect(qualificationService.getWorkers([], [])).rejects.toThrow(
        new ControlledError(
          ErrorQualification.AddressesOrEmailsMustBeProvided,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should return workers by addresses', async () => {
      const addresses = ['address1'];
      const users = [{ id: 1 } as UserEntity];

      userRepository.findByAddress = jest.fn().mockResolvedValue(users);

      const result = await qualificationService.getWorkers(addresses, []);

      expect(result).toEqual(users);
    });

    it('should return workers by emails', async () => {
      const emails = ['email1@example.com'];
      const users = [{ id: 1 } as UserEntity];

      userRepository.findByEmail = jest.fn().mockResolvedValue(users);

      const result = await qualificationService.getWorkers([], emails);

      expect(result).toEqual(users);
    });

    it('should throw an error if no workers are found', async () => {
      userRepository.find = jest.fn().mockResolvedValue([]);

      await expect(
        qualificationService.getWorkers(['address1'], []),
      ).rejects.toThrow(
        new ControlledError(
          ErrorQualification.NoWorkersFound,
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });
});
