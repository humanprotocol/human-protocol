import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserCreateDto } from './user.dto';
import { UserEntity } from './user.entity';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  Role,
} from '../../common/enums/user';
import { signMessage, verifySignature } from '../../common/utils/signature';
import {
  MOCK_ADDRESS,
  MOCK_EMAIL,
  MOCK_PRIVATE_KEY,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { DeepPartial } from 'typeorm';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { SignatureBodyDto } from '../user/user.dto';
import { SignatureType } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyEntity } from './site-key.entity';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { HttpService } from '@nestjs/axios';
import { ControlledError } from '../../common/errors/controlled';
import {
  ErrorOperator,
  ErrorSignature,
  ErrorUser,
} from '../../common/constants/errors';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { SiteKeyType } from '../../common/enums';

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
  let hcaptchaService: HCaptchaService;
  let siteKeyRepository: SiteKeyRepository;

  jest
    .spyOn(NetworkConfigService.prototype, 'networks', 'get')
    .mockReturnValue([
      {
        chainId: ChainId.POLYGON_AMOY,
        rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/1234567890',
      },
    ]);

  beforeEach(async () => {
    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        HCaptchaService,
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        {
          provide: SiteKeyRepository,
          useValue: createMock<SiteKeyRepository>(),
        },
        {
          provide: SiteKeyRepository,
          useValue: createMock<SiteKeyRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            signMessage: jest.fn(),
            prepareSignatureBody: jest.fn(),
            getOperatorAddress: jest
              .fn()
              .mockReturnValue(MOCK_ADDRESS.toLowerCase()),
            getValidChains: jest.fn().mockReturnValue([ChainId.LOCALHOST]),
          },
        },
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        ConfigService,
        Web3ConfigService,
        HCaptchaConfigService,
        NetworkConfigService,
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get(UserRepository);
    web3Service = moduleRef.get(Web3Service);
    hcaptchaService = moduleRef.get<HCaptchaService>(HCaptchaService);
    siteKeyRepository = moduleRef.get(SiteKeyRepository);
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
        role: Role.WORKER,
        status: UserStatus.PENDING,
      };

      const result = await userService.create(dto);
      expect(userRepository.createUnique).toHaveBeenCalledWith({
        email: dto.email,
        password: expect.any(String),
        role: Role.WORKER,
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
        .spyOn(userRepository, 'findOneByEmail')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByCredentials(email, password);

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(userEntity);
    });

    it('should return null if credentials are invalid', async () => {
      jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(null);
      const result = await userService.getByCredentials(email, password);
      expect(result).toBe(null);
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(email);
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
        .spyOn(userRepository, 'findOneByAddress')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByAddress(address);

      expect(userRepository.findOneByAddress).toHaveBeenCalledWith(address);
      expect(result).toBe(userEntity);
    });
  });

  describe('registerLabeler', () => {
    it('should register labeler successfully and return site key', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      const mockLabelerData = { sitekeys: [{ sitekey: 'site_key' }] };

      hcaptchaService.registerLabeler = jest.fn().mockResolvedValueOnce(true);
      hcaptchaService.getLabelerData = jest
        .fn()
        .mockResolvedValueOnce(mockLabelerData);

      web3Service.getSigner = jest.fn().mockReturnValue({
        signMessage: jest.fn().mockResolvedValue('site_key'),
      });

      const result = await userService.registerLabeler(
        userEntity as UserEntity,
      );

      expect(result).toEqual('site_key');
    });

    it('should throw InvalidType if user type is invalid', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.OPERATOR, // Invalid type
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(new BadRequestException(ErrorUser.InvalidType));
    });

    it('should throw KycNotApproved if user KYC status is not approved', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.PENDING_VERIFICATION,
        },
        save: jest.fn(),
      };

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(new BadRequestException(ErrorUser.KycNotApproved));
    });

    it('should return site key if user is already registered as a labeler', async () => {
      const siteKeyEntity: DeepPartial<SiteKeyEntity> = {
        id: 1,
        siteKey: 'site_key',
        type: SiteKeyType.HCAPTCHA,
      };
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        siteKeys: [siteKeyEntity],
        save: jest.fn(),
      };

      hcaptchaService.registerLabeler = jest.fn();

      const result = await userService.registerLabeler(
        userEntity as UserEntity,
      );

      expect(result).toEqual('site_key');
      expect(hcaptchaService.registerLabeler).toHaveBeenCalledTimes(0);
    });

    it('should throw LabelingEnableFailed if registering labeler fails', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      hcaptchaService.registerLabeler = jest.fn().mockResolvedValueOnce(false);

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(
        new ControlledError(
          ErrorUser.LabelingEnableFailed,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw LabelingEnableFailed if retrieving labeler data fails', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      hcaptchaService.registerLabeler = jest.fn().mockResolvedValueOnce(true);
      hcaptchaService.getLabelerData = jest.fn().mockResolvedValueOnce(null);

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(
        new ControlledError(
          ErrorUser.LabelingEnableFailed,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw NoWalletAddresRegistered if user does not have an evm address', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      hcaptchaService.registerLabeler = jest.fn().mockResolvedValueOnce(false);

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(
        new ControlledError(
          ErrorUser.NoWalletAddresRegistered,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('registerAddress', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOneByAddress').mockResolvedValue(null);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should update evm address and sign the address', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      const address = '0x123';
      const signature = 'valid-signature';

      // Mock web3Service methods
      web3Service.getSigner = jest.fn().mockReturnValue({
        signMessage: jest.fn().mockResolvedValue('signature'),
      });

      // Mock signature verification
      jest.spyOn(userService, 'prepareSignatureBody').mockResolvedValue({
        from: address,
        to: 'operator-address',
        contents: 'register-address',
        nonce: undefined,
      });

      (verifySignature as jest.Mock) = jest.fn().mockReturnValue(true);

      const result = await userService.registerAddress(
        userEntity as UserEntity,
        { address, signature },
      );

      expect(userRepository.updateOne).toHaveBeenCalledWith(userEntity);
      expect(result).toEqual({
        key: `KYC-${MOCK_ADDRESS.toLowerCase()}`,
        value: 'signature',
      });
    });

    it("should fail if address is different from user's evm address", async () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: '',
        evmAddress: '0x123',
      };

      const address = '0x456';
      const signature = 'valid-signature';

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorUser.AlreadyAssigned, HttpStatus.BAD_REQUEST),
      );
    });

    it("should fail if user's kyc is not approved", async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          country: 'FR',
          status: KycStatus.PENDING_VERIFICATION,
        },
      };

      const address = '0x123';
      const signature = 'valid-signature';

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorUser.KycNotApproved, HttpStatus.BAD_REQUEST),
      );
    });

    it("should fail if user's address already exists", async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        evmAddress: '0x123',
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
      };

      const address = '0x123';
      const signature = 'valid-signature';

      jest
        .spyOn(userRepository, 'findOneByAddress')
        .mockResolvedValue(userEntity as any);

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorUser.AlreadyAssigned, HttpStatus.BAD_REQUEST),
      );
    });

    it('should fail if address already registered with another user', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
      };

      const address = '0x123';
      const signature = 'valid-signature';

      jest.spyOn(userRepository, 'findOneByAddress').mockResolvedValue({
        id: 2,
        email: '',
        evmAddress: '0x123',
      } as any);

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new ControlledError(
          ErrorUser.DuplicatedAddress,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should fail if the signature is invalid', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          country: 'FR',
          status: KycStatus.APPROVED,
        },
        save: jest.fn(),
      };

      const address = '0x123';
      const signature = 'invalid-signature';

      // Mock web3Service methods
      web3Service.getSigner = jest.fn().mockReturnValue({
        signMessage: jest.fn().mockResolvedValue('signature'),
      });

      // Mock signature verification
      jest.spyOn(userService, 'prepareSignatureBody').mockResolvedValue({
        from: address,
        to: 'operator-address',
        contents: 'register-address',
        nonce: undefined,
      });

      (verifySignature as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.CONFLICT,
        );
      });

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.CONFLICT,
        ),
      );
    });
  });

  describe('enableOperator', () => {
    const signatureBody: SignatureBodyDto = {
      from: MOCK_ADDRESS,
      to: MOCK_ADDRESS,
      contents: 'enable-operator',
      nonce: undefined,
    };

    const userEntity: DeepPartial<UserEntity> = {
      id: 1,
      evmAddress: MOCK_ADDRESS,
    };

    beforeEach(() => {
      jest
        .spyOn(userService as any, 'prepareSignatureBody')
        .mockReturnValue(signatureBody);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should enable an operator', async () => {
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.INACTIVE),
        set: jest.fn(),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      const result = await userService.enableOperator(
        userEntity as any,
        signature,
      );

      expect(result).toBe(undefined);
      expect(userService.prepareSignatureBody).toHaveBeenCalledWith(
        SignatureType.ENABLE_OPERATOR,
        MOCK_ADDRESS,
      );
      expect(web3Service.getSigner).toHaveBeenCalledWith(ChainId.POLYGON_AMOY);

      expect(kvstoreClientMock.get).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      );
      expect(kvstoreClientMock.set).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        OperatorStatus.ACTIVE,
      );
    });

    it("should throw ConflictException if signature doesn't match", async () => {
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.INACTIVE),
        set: jest.fn(),
      };
      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );

      (verifySignature as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.CONFLICT,
        );
      });

      const invalidSignature = await signMessage(
        'invalid message',
        MOCK_PRIVATE_KEY,
      );

      await expect(
        userService.enableOperator(userEntity as any, invalidSignature),
      ).rejects.toThrow(
        new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BadRequestException if operator already enabled in KVStore', async () => {
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.ACTIVE),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      await expect(
        userService.enableOperator(userEntity as any, signature),
      ).rejects.toThrow(
        new ControlledError(
          ErrorOperator.OperatorAlreadyActive,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('disableOperator', () => {
    const signatureBody: SignatureBodyDto = {
      from: MOCK_ADDRESS,
      to: MOCK_ADDRESS,
      contents: 'disable-operator',
      nonce: undefined,
    };

    const userEntity: DeepPartial<UserEntity> = {
      id: 1,
      evmAddress: MOCK_ADDRESS,
    };

    beforeEach(() => {
      jest
        .spyOn(userService as any, 'prepareSignatureBody')
        .mockReturnValue(signatureBody);
    });

    afterEach(() => {
      jest.resetAllMocks();
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
      expect(userService.prepareSignatureBody).toHaveBeenCalledWith(
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
      const kvstoreClientMock = {
        get: jest.fn().mockResolvedValue(OperatorStatus.ACTIVE),
        set: jest.fn(),
      };
      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );

      (verifySignature as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.CONFLICT,
        );
      });

      const invalidSignature = await signMessage(
        'invalid message',
        MOCK_PRIVATE_KEY,
      );

      await expect(
        userService.disableOperator(userEntity as any, invalidSignature),
      ).rejects.toThrow(
        new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.BAD_REQUEST,
        ),
      );
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
      ).rejects.toThrow(
        new ControlledError(
          ErrorOperator.OperatorNotActive,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('prepareSignatureBody', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should prepare web3 pre sign up payload and return typed structured data', async () => {
      const expectedData: SignatureBodyDto = {
        from: MOCK_ADDRESS.toLowerCase(),
        to: MOCK_ADDRESS.toLowerCase(),
        contents: 'signup',
        nonce: undefined,
      };

      const result = await userService.prepareSignatureBody(
        SignatureType.SIGNUP,
        MOCK_ADDRESS,
      );

      expect(result).toStrictEqual(expectedData);
    });

    it('should prepare web3 pre register address payload and return typed structured data', async () => {
      const expectedData: SignatureBodyDto = {
        from: MOCK_ADDRESS.toLowerCase(),
        to: MOCK_ADDRESS.toLowerCase(),
        contents: 'register-address',
        nonce: undefined,
      };

      const result = await userService.prepareSignatureBody(
        SignatureType.REGISTER_ADDRESS,
        MOCK_ADDRESS,
      );

      expect(result).toStrictEqual(expectedData);
    });
  });

  describe('registerOracle', () => {
    it('should register a new oracle for the user', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
      };

      const oracleAddress = '0xOracleAddress';

      await userService.registerOracle(userEntity as UserEntity, oracleAddress);

      expect(siteKeyRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          siteKey: oracleAddress,
          type: SiteKeyType.REGISTRATION,
          user: userEntity,
        }),
      );
    });
  });

  describe('getRegisteredOracles', () => {
    it('should return a list of registered oracles for the user', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
      };

      const siteKeys: SiteKeyEntity[] = [
        { siteKey: '0xOracleAddress1' } as SiteKeyEntity,
        { siteKey: '0xOracleAddress2' } as SiteKeyEntity,
      ];

      jest
        .spyOn(siteKeyRepository, 'findByUserAndType')
        .mockResolvedValue(siteKeys);

      const result = await userService.getRegisteredOracles(
        userEntity as UserEntity,
      );

      expect(result).toEqual(['0xOracleAddress1', '0xOracleAddress2']);
    });
  });
});
