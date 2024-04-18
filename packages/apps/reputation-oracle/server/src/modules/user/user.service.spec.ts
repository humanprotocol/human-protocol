import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserCreateDto } from './user.dto';
import { UserEntity } from './user.entity';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  UserType,
} from '../../common/enums/user';
import { signMessage } from '../../common/utils/signature';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { DeepPartial } from 'typeorm';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { SignatureBodyDto } from '../web3/web3.dto';
import { SignatureType } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let web3Service: Web3Service;

  beforeEach(async () => {
    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            signMessage: jest.fn(),
            prepareSignatureBody: jest.fn(),
          },
        },
        ConfigService,
        Web3ConfigService,
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get(UserRepository);
    web3Service = moduleRef.get(Web3Service);
  });

  describe('create', () => {
    it('should create a new user and return the created user entity', async () => {
      const dto: UserCreateDto = {
        email: 'test@example.com',
        password: 'password123',
        hCaptchaToken: 'test',
      };
      const createdUser: Partial<UserEntity> = {
        email: dto.email,
        password: expect.any(String),
        type: UserType.WORKER,
        status: UserStatus.PENDING,
      };

      const result = await userService.create(dto);
      expect(userRepository.createUnique).toHaveBeenCalledWith({
        email: dto.email,
        password: expect.any(String),
        type: UserType.WORKER,
        status: UserStatus.PENDING,
      });
      expect(result).toMatchObject(createdUser);
    });
  });

  describe('getByCredentials', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword =
      '$2b$12$Z02o9/Ay7CT0n99icApZYORH8iJI9VGtl3mju7d0c4SdDDujhSzOa';

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email,
      password: hashedPassword,
    };
    it('should return the user entity if credentials are valid', async () => {
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByCredentials(email, password);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(userEntity);
    });

    it('should return null if credentials are invalid', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const result = await userService.getByCredentials(email, password);
      expect(result).toBe(null);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('getByAddress', () => {
    it('should return the user entity if the address exists', async () => {
      const address = '0x0755D4d722a4a201c1C5A4B5E614D913e7747b36';
      const userEntity: Partial<UserEntity> = {
        id: 1,
        evmAddress: address,
      };

      jest
        .spyOn(userRepository, 'findOneByEvmAddress')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByAddress(address);

      expect(userRepository.findOneByEvmAddress).toHaveBeenCalledWith(address);
      expect(result).toBe(userEntity);
    });
  });

  describe('registerAddress', () => {
    it('should update evm address and sign the address', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      const address = '0x123';

      web3Service.getSigner = jest.fn().mockReturnValue({
        signMessage: jest.fn().mockResolvedValue('signature'),
      });

      const result = await userService.registerAddress(
        userEntity as UserEntity,
        { chainId: ChainId.POLYGON_AMOY, address },
      );

      expect(userEntity.save).toHaveBeenCalledWith();
      expect(result).toBe('signature');
    });

    it("should fail if address is different from user's evm address", async () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: '',
        evmAddress: '0x123',
      };

      const address = '0x456';

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          chainId: ChainId.POLYGON_AMOY,
          address,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should fail if user's kyc is not approved", async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        evmAddress: '0x123',
        kyc: {
          status: KycStatus.PENDING_VERIFICATION,
        },
      };

      const address = '0x123';

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          chainId: ChainId.POLYGON_AMOY,
          address,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disableOperator', () => {
    const signatureBody: SignatureBodyDto = {
      from: MOCK_ADDRESS,
      to: MOCK_ADDRESS,
      contents: 'signup',
    };

    const userEntity: DeepPartial<UserEntity> = {
      id: 1,
      evmAddress: MOCK_ADDRESS,
    };

    beforeEach(() => {
      jest
        .spyOn(web3Service as any, 'prepareSignatureBody')
        .mockReturnValue(signatureBody);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should disable an user', async () => {
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.ACTIVE),
        set: jest.fn(),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      const result = await userService.disableOperator(
        userEntity as any,
        signature,
      );

      expect(result).toBe(undefined);
      expect(web3Service.prepareSignatureBody).toHaveBeenCalledWith(
        SignatureType.DISABLE_OPERATOR,
        MOCK_ADDRESS,
      );
      expect(web3Service.getSigner).toHaveBeenCalledWith(ChainId.POLYGON_AMOY);

      expect(kvstoreClientMock.get).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      );
      expect(kvstoreClientMock.set).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        OperatorStatus.INACTIVE,
      );
    });

    it("should throw ConflictException if signature doesn't match", async () => {
      const invalidSignature = await signMessage(
        'invalid message',
        MOCK_PRIVATE_KEY,
      );

      await expect(
        userService.disableOperator(userEntity as any, invalidSignature),
      ).rejects.toThrow(ConflictException);
    });
    it('should throw BadRequestException if operator already disabled in KVStore', async () => {
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.INACTIVE),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      await expect(
        userService.disableOperator(userEntity as any, signature),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
