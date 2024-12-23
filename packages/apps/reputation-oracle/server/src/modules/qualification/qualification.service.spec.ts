import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
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
import { mockConfig } from '../../../test/constants';

describe('QualificationService', () => {
  let qualificationService: QualificationService;
  let qualificationRepository: QualificationRepository;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        QualificationService,
        {
          provide: QualificationRepository,
          useValue: createMock<QualificationRepository>(),
        },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
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

    it('should create a new qualification without expiresAt', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = createQualificationDto.reference;
      qualificationEntity.title = createQualificationDto.title;
      qualificationEntity.description = createQualificationDto.description;
      qualificationEntity.expiresAt = null;

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
        expiresAt: null,
      });
    });

    it('should throw an error if the expiration date is in the past', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
        expiresAt: new Date('2000-01-01'),
      };

      const errorMessage =
        QualificationErrorMessage.INVALID_EXPIRATION_TIME.replace(
          '%minValidity%',
          '1',
        );

      await expect(
        qualificationService.createQualification(createQualificationDto),
      ).rejects.toThrow(
        new QualificationError(
          errorMessage as QualificationErrorMessage,
          'ref1',
        ),
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

    it('should return a list of qualifications with null expiresAt', async () => {
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
        new QualificationError(QualificationErrorMessage.NOT_FOUND, 'ref1'),
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

    it('should assign users to a qualification with null expiresAt', async () => {
      const assignQualificationDto: AssignQualificationDto = {
        reference: 'ref1',
        workerAddresses: ['address1'],
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = 'ref1';
      qualificationEntity.expiresAt = null;
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
        }),
      ).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, 'ref1'),
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

    it('should unassign users from a qualification with null expiresAt', async () => {
      const unassignQualificationDto: UnassignQualificationDto = {
        reference: 'ref1',
        workerAddresses: ['address1'],
      };

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = 'ref1';
      qualificationEntity.expiresAt = null;
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
        }),
      ).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, 'ref1'),
      );
    });
  });

  describe('getWorkers', () => {
    it('should return workers by addresses', async () => {
      const addresses = ['address1'];
      const users = [{ id: 1 } as UserEntity];

      userRepository.findByAddress = jest.fn().mockResolvedValue(users);

      const result = await qualificationService.getWorkers(addresses);

      expect(result).toEqual(users);
    });
  });
});
