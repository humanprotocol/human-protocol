import { Test, TestingModule } from '@nestjs/testing';
import { NDAService } from './nda.service';
import { UserRepository } from '../user/user.repository';
import { AuthConfigService } from '../../config/auth-config.service';
import { NDASignatureDto } from './nda.dto';
import { NDAError, NDAErrorMessage } from './nda.error';
import { faker } from '@faker-js/faker/.';

const mockUserRepository = {
  updateOne: jest.fn(),
};
const validNdaUrl = faker.internet.url();
const mockAuthConfigService = {
  latestNdaUrl: validNdaUrl,
};

describe('NDAService', () => {
  let service: NDAService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NDAService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AuthConfigService, useValue: mockAuthConfigService },
      ],
    }).compile();

    service = module.get<NDAService>(NDAService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signNDA', () => {
    const user: any = {
      id: 1,
      email: faker.internet.email(),
      password: 'password',
      ndaSigned: undefined,
    };

    const nda: NDASignatureDto = {
      url: validNdaUrl,
    };

    it('should sign the NDA if the URL is valid and the user has not signed it yet', async () => {
      await service.signNDA(user, nda);

      expect(user.ndaSigned).toBe(validNdaUrl);
      expect(mockUserRepository.updateOne).toHaveBeenCalledWith(user);
    });

    it('should throw an error if the NDA URL is invalid', async () => {
      const invalidNda: NDASignatureDto = {
        url: faker.internet.url(),
      };

      await expect(service.signNDA(user, invalidNda)).rejects.toThrow(
        new NDAError(NDAErrorMessage.INVALID_NDA, user.id),
      );
    });

    it('should throw an error if the user has already signed the NDA', async () => {
      user.ndaSigned = mockAuthConfigService.latestNdaUrl;

      await expect(service.signNDA(user, nda)).rejects.toThrow(
        new NDAError(NDAErrorMessage.NDA_EXISTS, user.id),
      );
    });
  });
});
