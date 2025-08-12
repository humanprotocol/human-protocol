import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ServerConfigService } from '@/config';
import { UserStatus, UserRepository } from '@/modules/user';
import { generateWorkerUser } from '@/modules/user/fixtures';
import { generateFutureDate } from '~/test/fixtures/date';
import { generateEthWallet } from '~/test/fixtures/web3';

import { QualificationEntity } from './qualification.entity';
import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
import { QualificationRepository } from './qualification.repository';
import { QualificationService } from './qualification.service';
import { UserQualificationRepository } from './user-qualification.repository';

const mockQualificationRepository = createMock<QualificationRepository>();
const mockUserQualificationRepository =
  createMock<UserQualificationRepository>();
const mockUserRepository = createMock<UserRepository>();

describe('QualificationService', () => {
  let service: QualificationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QualificationService,
        {
          provide: QualificationRepository,
          useValue: mockQualificationRepository,
        },
        {
          provide: UserQualificationRepository,
          useValue: mockUserQualificationRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        ServerConfigService,
        ConfigService,
      ],
    }).compile();

    service = module.get<QualificationService>(QualificationService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createQualification', () => {
    it.each([generateFutureDate(2), undefined])(
      'should create a new qualification',
      async (expiresAt) => {
        const newQualification = {
          title: faker.string.alpha(),
          description: faker.string.alpha(),
          expiresAt,
        };

        mockQualificationRepository.createUnique.mockImplementationOnce(
          async (e) => e,
        );

        const qualification =
          await service.createQualification(newQualification);

        expect(mockQualificationRepository.createUnique).toHaveBeenCalledTimes(
          1,
        );
        expect(mockQualificationRepository.createUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            ...newQualification,
          }),
        );
        expect(qualification).toEqual({
          ...newQualification,
          reference: expect.any(String),
          expiresAt: newQualification.expiresAt?.toISOString(),
        });
      },
    );

    it('should throw a INVALID_EXPIRATION_TIME error', async () => {
      const newQualification = {
        title: faker.string.alpha(),
        description: faker.string.alpha(),
        expiresAt: faker.date.past(),
      };

      let thrownError;
      try {
        await service.createQualification(newQualification);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(QualificationError);
      expect(thrownError.message).toContain(
        'Qualification should be valid till at least',
      );
      expect(mockQualificationRepository.createUnique).not.toHaveBeenCalled();
    });
  });

  describe('deleteQualification', () => {
    it('should delete qualification by reference', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );

      mockUserQualificationRepository.findByQualification.mockResolvedValueOnce(
        [],
      );

      await service.deleteQualification(reference);

      expect(mockQualificationRepository.deleteOne).toHaveBeenCalledTimes(1);
      expect(mockQualificationRepository.deleteOne).toHaveBeenCalledWith(
        qualificationEntity,
      );
    });

    it('should throw NOT_FOUND error', async () => {
      const reference = faker.string.uuid();
      mockQualificationRepository.findByReference.mockResolvedValueOnce(null);

      await expect(service.deleteQualification(reference)).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, reference),
      );
    });
  });

  describe('assign', () => {
    it('should assign user to qualification', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };
      const user = generateWorkerUser({
        privateKey: generateEthWallet().privateKey,
      });

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );
      mockUserRepository.findWorkersByAddresses.mockResolvedValueOnce([user]);

      const result = await service.assign(reference, [
        user.evmAddress as string,
      ]);

      expect(result).toEqual({
        success: [user.evmAddress],
        failed: [],
      });

      expect(
        mockUserQualificationRepository.createUnique,
      ).toHaveBeenCalledTimes(1);
    });

    it('should fail to assign user not in active status', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };
      const user = generateWorkerUser({
        privateKey: generateEthWallet().privateKey,
        status: UserStatus.INACTIVE,
      });

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );
      mockUserRepository.findWorkersByAddresses.mockResolvedValueOnce([user]);

      const result = await service.assign(reference, [
        user.evmAddress as string,
      ]);

      expect(result).toEqual({
        success: [],
        failed: [
          {
            evmAddress: user.evmAddress as string,
            reason: 'User is not in active status',
          },
        ],
      });

      expect(
        mockUserQualificationRepository.createUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND error', async () => {
      const reference = faker.string.uuid();

      mockQualificationRepository.findByReference.mockResolvedValueOnce(null);

      await expect(
        service.assign(reference, [faker.finance.ethereumAddress()]),
      ).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, reference),
      );
    });

    it('should throw NO_WORKERS_FOUND error', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );

      mockUserRepository.findWorkersByAddresses.mockResolvedValueOnce([]);

      await expect(
        service.assign(reference, [faker.finance.ethereumAddress()]),
      ).rejects.toThrow(
        new QualificationError(
          QualificationErrorMessage.NO_WORKERS_FOUND,
          reference,
        ),
      );
    });
  });

  describe('unassign', () => {
    it('should unassign user from a qualification', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };
      const user = generateWorkerUser({
        privateKey: generateEthWallet().privateKey,
      });

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );
      mockUserRepository.findWorkersByAddresses.mockResolvedValueOnce([user]);

      const result = await service.unassign(reference, [
        user.evmAddress as string,
      ]);

      expect(result).toEqual({
        success: [user.evmAddress],
        failed: [],
      });

      expect(
        mockUserQualificationRepository.removeByUserAndQualification,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw NOT_FOUND error', async () => {
      const reference = faker.string.uuid();
      mockQualificationRepository.findByReference.mockResolvedValueOnce(null);

      await expect(
        service.unassign(reference, [faker.finance.ethereumAddress()]),
      ).rejects.toThrow(
        new QualificationError(QualificationErrorMessage.NOT_FOUND, reference),
      );
    });

    it('should throw NO_WORKERS_FOUND error', async () => {
      const reference = faker.string.uuid();
      const qualificationEntity = {
        reference,
        title: faker.string.alpha(),
        description: faker.string.alpha(),
      };

      mockQualificationRepository.findByReference.mockResolvedValueOnce(
        qualificationEntity as QualificationEntity,
      );

      mockUserRepository.findWorkersByAddresses.mockResolvedValueOnce([]);

      await expect(
        service.unassign(reference, [faker.finance.ethereumAddress()]),
      ).rejects.toThrow(
        new QualificationError(
          QualificationErrorMessage.NO_WORKERS_FOUND,
          reference,
        ),
      );
    });
  });
});
