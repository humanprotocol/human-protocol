import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { NDAService } from './nda.service';
import { NDARepository } from './nda.repository';
import { NDAVersionRepository } from './nda-version.repository';
import { NDAEntity } from './nda.entity';
import { UserEntity } from '../user/user.entity';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorNda } from '../../common/constants/errors';
import { NDAVersionEntity } from './nda-version.entity';
import { NdaStatus } from '../../common/enums';

describe.only('NDAService', () => {
  let ndaService: NDAService;
  let ndaRepository: NDARepository;
  let ndaVersionRepository: NDAVersionRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NDAService,
        {
          provide: NDARepository,
          useValue: {
            getLastNDA: jest.fn(),
            findSignedNDAByUserAndVersion: jest.fn(),
            createUnique: jest.fn(),
          },
        },
        {
          provide: NDAVersionRepository,
          useValue: {
            getLastNDAVersion: jest.fn(),
          },
        },
      ],
    }).compile();

    ndaService = moduleRef.get<NDAService>(NDAService);
    ndaRepository = moduleRef.get<NDARepository>(NDARepository);
    ndaVersionRepository =
      moduleRef.get<NDAVersionRepository>(NDAVersionRepository);
  });

  describe.only('getLastNDAVersion', () => {
    it('should return last NDA version DTO if last NDA exists', async () => {
      const user: UserEntity = {} as UserEntity;
      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        version: '0.1.0',
        documentText: 'Sample NDA document',
      };

      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as any);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce(null);

      const result = await ndaService.getLastNDAVersion(user);

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
      expect(ndaRepository.findSignedNDAByUserAndVersion).toHaveBeenCalled();
      expect(result).toEqual({
        version: mockLastNDAVersion.version,
        documentText: mockLastNDAVersion.documentText,
      });
    });

    it('should throw ControlledError with NOT_FOUND status if last NDA version is not found', async () => {
      const user: Partial<UserEntity> = {
        email: 'test@example.com',
        password: 'password123',
        ndas: [],
      };

      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(null);

      await expect(
        ndaService.getLastNDAVersion(user as UserEntity),
      ).rejects.toThrow(
        new ControlledError(ErrorNda.NotFound, HttpStatus.NOT_FOUND),
      );

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
    });

    it('should return null if last NDA is found', async () => {
      const nda: Partial<NDAEntity> = {
        status: NdaStatus.SIGNED,
      };

      const user: Partial<UserEntity> = {
        email: 'test@example.com',
        password: 'password123',
        ndas: [nda as any],
      };

      const mockLastNDAVersion: Partial<NDAVersionEntity> = {
        version: '0.1.0',
        documentText: 'Sample NDA document',
      };

      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion as any);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce(nda as NDAEntity);

      const result = await ndaService.getLastNDAVersion(user as UserEntity);

      expect(ndaRepository.findSignedNDAByUserAndVersion).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('signNDA', () => {
    const mockUser: UserEntity = {} as UserEntity;
    const mockIpAddress = '127.0.0.1';

    it('should return true and create a new NDA if not signed before', async () => {
      const mockLastNDAVersion = {} as any;
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(ndaRepository, 'createUnique')
        .mockResolvedValueOnce({} as NDAEntity);

      const result = await ndaService.signNDA(mockUser, mockIpAddress);

      expect(ndaVersionRepository.getLastNDAVersion).toHaveBeenCalled();
      expect(ndaRepository.findSignedNDAByUserAndVersion).toHaveBeenCalledWith(
        mockUser,
        mockLastNDAVersion,
      );
      expect(ndaRepository.createUnique).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return null if NDA is already signed by the user', async () => {
      const mockLastNDAVersion = {} as any;
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(mockLastNDAVersion);
      jest
        .spyOn(ndaRepository, 'findSignedNDAByUserAndVersion')
        .mockResolvedValueOnce({} as NDAEntity);

      const result = await ndaService.signNDA(mockUser, mockIpAddress);

      expect(result).toBe(null);
    });

    it('should throw ControlledError with NOT_FOUND status if last NDA version is not found', async () => {
      jest
        .spyOn(ndaVersionRepository, 'getLastNDAVersion')
        .mockResolvedValueOnce(null);

      await expect(ndaService.signNDA(mockUser, mockIpAddress)).rejects.toThrow(
        new ControlledError(ErrorNda.NotFound, HttpStatus.NOT_FOUND),
      );
    });
  });
});
