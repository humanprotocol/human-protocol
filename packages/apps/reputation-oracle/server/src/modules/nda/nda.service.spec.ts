import { faker } from '@faker-js/faker/.';
import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity, UserRepository } from '../user';
import { NDAConfigService } from '../../config/nda-config.service';
import { NDASignatureDto } from './nda.dto';
import { NDAError, NDAErrorMessage } from './nda.error';
import { NDAService } from './nda.service';

const mockUserRepository = {
  updateOne: jest.fn(),
};
const mockNdaConfigService = {
  latestNdaUrl: faker.internet.url(),
};

describe('NDAService', () => {
  let service: NDAService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NDAService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: NDAConfigService, useValue: mockNdaConfigService },
      ],
    }).compile();

    service = module.get<NDAService>(NDAService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signNDA', () => {
    it('should sign the NDA if the URL is valid and the user has not signed it yet', async () => {
      const user = {
        id: faker.number.int(),
        email: faker.internet.email(),
        ndaSignedUrl: null,
      };

      const nda: NDASignatureDto = {
        url: mockNdaConfigService.latestNdaUrl,
      };

      await service.signNDA(user as UserEntity, nda);

      expect(user.ndaSignedUrl).toBe(mockNdaConfigService.latestNdaUrl);
      expect(mockUserRepository.updateOne).toHaveBeenCalledWith(user);
    });

    it('should throw an error if the NDA URL is invalid', async () => {
      const user: Pick<UserEntity, 'id' | 'email' | 'ndaSignedUrl'> = {
        id: faker.number.int(),
        email: faker.internet.email(),
        ndaSignedUrl: null,
      };

      const invalidNda: NDASignatureDto = {
        url: faker.internet.url(),
      };

      await expect(
        service.signNDA(user as UserEntity, invalidNda),
      ).rejects.toThrow(new NDAError(NDAErrorMessage.INVALID_NDA, user.id));
    });

    it('should return ok if the user has already signed the NDA', async () => {
      const user = {
        id: faker.number.int(),
        email: faker.internet.email(),
        ndaSignedUrl: mockNdaConfigService.latestNdaUrl,
      };

      const nda: NDASignatureDto = {
        url: mockNdaConfigService.latestNdaUrl,
      };

      await service.signNDA(user as UserEntity, nda);

      expect(mockUserRepository.updateOne).not.toHaveBeenCalled();
    });
  });
});
