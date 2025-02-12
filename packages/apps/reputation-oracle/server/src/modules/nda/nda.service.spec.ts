import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NDAService } from './nda.service';
import { NDARepository } from './nda.repository';
import { NDAVersionRepository } from './nda-version.repository';
import { NDASignatureEntity } from './nda-signature.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionEntity } from './nda-version.entity';
import { NdaSignatureStatus } from '../../common/enums';
import { NdaError, NdaErrorMessage } from './nda.error';
import { faker } from '@faker-js/faker/.';

const user: Partial<UserEntity> = {
  id: faker.number.int(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  ndaSignatures: [
    {
      id: faker.number.int(),
      status: NdaSignatureStatus.SIGNED,
      ipAddress: faker.internet.ip(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ndaVersion: {} as NDAVersionEntity,
    } as NDASignatureEntity,
  ],
};

describe.only('NDAService', () => {
  let ndaService: NDAService;
  let ndaRepository: NDARepository;
  let ndaVersionRepository: NDAVersionRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NDAService,
        {
          provide: NDARepository,
          useValue: createMock<NDARepository>(),
        },
        {
          provide: NDAVersionRepository,
          useValue: createMock<NDAVersionRepository>(),
        },
      ],
    }).compile();

    ndaService = moduleRef.get<NDAService>(NDAService);
    ndaRepository = moduleRef.get<NDARepository>(NDARepository);
    ndaVersionRepository =
      moduleRef.get<NDAVersionRepository>(NDAVersionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLastNDAVersion', () => {
    it('should return last NDA version DTO if last NDA exists', async () => {
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        version: faker.string.alphanumeric(3),
        documentText: faker.string.alphanumeric(60),
      };

      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as any);

      const result = await ndaService.getLastNDAVersion(user as UserEntity);

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
      expect(result).toEqual({
        version: mockLastNDAVersion.version,
        documentText: mockLastNDAVersion.documentText,
      });
    });

    it('should throw ControlledError with NOT_FOUND status if last NDA version is not found', async () => {
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(null);

      await expect(
        ndaService.getLastNDAVersion(user as UserEntity),
      ).rejects.toThrow(new NdaError(NdaErrorMessage.NDA_NOT_FOUND, user.id!));

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
    });
  });

  describe('signNDA', () => {
    const mockIpAddress = faker.internet.ip();
    it('should return true and create a new NDA if not signed before', async () => {
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        version: faker.string.alphanumeric(3),
        documentText: faker.string.alphanumeric(60),
        id: faker.number.int(),
      };
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as NDAVersionEntity);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(ndaRepository, 'createUnique')
        .mockResolvedValueOnce({} as NDASignatureEntity);

      const result = await ndaService.signNDA(
        user as UserEntity,
        mockIpAddress,
      );

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
      expect(ndaRepository.findSignedNDAByUserAndVersion).toHaveBeenCalledWith(
        user,
        mockLastNDAVersion.id,
      );
      expect(ndaRepository.createUnique).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw an error if last NDA is already signed', async () => {
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        id: user!.ndaSignatures![0].ndaVersionId,
      };
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as NDAVersionEntity);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce({} as NDASignatureEntity);

      await expect(
        ndaService.signNDA(user as UserEntity, mockIpAddress),
      ).rejects.toThrow(
        new NdaError(NdaErrorMessage.NDA_ALREADY_SIGNED, user.id!),
      );

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
      expect(ndaRepository.findSignedNDAByUserAndVersion).toHaveBeenCalledWith(
        user,
        mockLastNDAVersion.id,
      );
    });

    it('should throw an error if last NDA version is not found', async () => {
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(null);

      await expect(
        ndaService.signNDA(user as UserEntity, mockIpAddress),
      ).rejects.toThrow(new NdaError(NdaErrorMessage.NDA_NOT_FOUND, user.id!));
    });
  });

  describe('isLatestSigned', () => {
    it('should return true if the latest NDA version is signed', async () => {
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        id: faker.number.int(),
      };
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as NDAVersionEntity);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce({} as NDASignatureEntity);

      const result = await ndaService.isLatestSigned(user as UserEntity);

      expect(result).toBe(true);
    });

    it('should return false if the latest NDA version is not signed', async () => {
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        id: faker.number.int(),
      };
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as NDAVersionEntity);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce(null);

      const result = await ndaService.isLatestSigned(user as UserEntity);

      expect(result).toBe(false);
    });

    it('should return false if the latest NDA version is not found', async () => {
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(null);

      const result = await ndaService.isLatestSigned(user as UserEntity);

      expect(result).toBe(false);
    });
  });
});
