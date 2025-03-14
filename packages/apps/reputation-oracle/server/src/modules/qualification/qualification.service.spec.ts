import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
import { CreateQualificationDto } from './qualification.dto';
import { QualificationEntity } from './qualification.entity';
import { UserQualificationEntity } from './user-qualification.entity';
import { ServerConfigService } from '../../config/server-config.service';
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
        expiresAt: '2025-12-31T00:00:00.000Z',
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
        expiresAt: createQualificationDto.expiresAt,
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
      });
    });

    it('should throw an error if the expiration date is in the past', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'ref1',
        title: 'title1',
        description: 'desc1',
        expiresAt: '2000-01-01T00:00:00.000Z',
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
        expiresAt: '2025-12-31T00:00:00.000Z',
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
      const reference = 'ref1';
      const workerAddresses = ['address1'];

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = reference;
      qualificationEntity.userQualifications = [];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      userRepository.findWorkersByAddresses = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.assign(reference, workerAddresses);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('should assign users to a qualification with null expiresAt', async () => {
      const reference = 'ref1';
      const workerAddresses = ['address1'];

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = reference;
      qualificationEntity.expiresAt = null;
      qualificationEntity.userQualifications = [];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      userRepository.findWorkersByAddresses = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.assign(reference, workerAddresses);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the qualification is not found', async () => {
      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(null);

      await expect(qualificationService.assign('ref1', [])).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, 'ref1'),
      );
    });
  });

  describe('unassign', () => {
    beforeEach(() => {
      qualificationRepository.saveUserQualifications = jest.fn();
    });

    it('should unassign users from a qualification', async () => {
      const reference = 'ref1';
      const workerAddresses = ['address1'];

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = reference;
      qualificationEntity.userQualifications = [
        { id: 1 } as UserQualificationEntity,
      ];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      userRepository.findWorkersByAddresses = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.unassign(reference, workerAddresses);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(0);
    });

    it('should unassign users from a qualification with null expiresAt', async () => {
      const reference = 'ref1';
      const workerAddresses = ['address1'];

      const qualificationEntity = new QualificationEntity();
      qualificationEntity.reference = reference;
      qualificationEntity.expiresAt = null;
      qualificationEntity.userQualifications = [
        { id: 1 } as UserQualificationEntity,
      ];

      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(qualificationEntity);
      userRepository.findWorkersByAddresses = jest
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      await qualificationService.unassign(reference, workerAddresses);

      expect(
        qualificationRepository.saveUserQualifications,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if the qualification is not found', async () => {
      qualificationRepository.findByReference = jest
        .fn()
        .mockResolvedValue(null);

      await expect(qualificationService.unassign('ref1', [])).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, 'ref1'),
      );
    });
  });
});
