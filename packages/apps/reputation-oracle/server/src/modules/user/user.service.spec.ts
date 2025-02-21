import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { RegistrationInExchangeOracleDto } from './user.dto';
import { UserEntity } from './user.entity';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  Role,
} from '../../common/enums/user';
import { signMessage, prepareSignatureBody } from '../../utils/web3';
import {
  MOCK_ADDRESS,
  MOCK_EMAIL,
  MOCK_PRIVATE_KEY,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { DeepPartial } from 'typeorm';
import { ChainId, KVStoreClient, KVStoreUtils } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { SignatureBodyDto } from '../user/user.dto';
import { SignatureType } from '../../common/enums/web3';
import { Web3ConfigService } from '../../config/web3-config.service';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyEntity } from './site-key.entity';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { HCaptchaConfigService } from '../../config/hcaptcha-config.service';
import { HttpService } from '@nestjs/axios';
import {
  UserError,
  UserErrorMessage,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from '../../modules/user/user.error';
import { NetworkConfigService } from '../../config/network-config.service';
import { SiteKeyType } from '../../common/enums';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
    })),
  },
  KVStoreUtils: {
    get: jest.fn(),
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
            getOperatorAddress: jest
              .fn()
              .mockReturnValue(MOCK_ADDRESS.toLowerCase()),
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

  describe('checkPasswordMatchesHash', () => {
    const password = 'password123';
    const hashedPassword =
      '$2b$12$Z02o9/Ay7CT0n99icApZYORH8iJI9VGtl3mju7d0c4SdDDujhSzOa';

    it('should return true if password matches', () => {
      const result = UserService.checkPasswordMatchesHash(
        password,
        hashedPassword,
      );

      expect(result).toBe(true);
    });

    it('should return false if password does not match', () => {
      const result = UserService.checkPasswordMatchesHash(
        password,
        '321drowssap',
      );

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a new user and return the created user entity', async () => {
      const createUserData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const createdUser: Partial<UserEntity> = {
        email: createUserData.email,
        password: expect.any(String),
        role: Role.WORKER,
        status: UserStatus.PENDING,
      };

      const result = await userService.create(createUserData);
      expect(userRepository.createUnique).toHaveBeenCalledWith({
        email: createUserData.email,
        password: expect.any(String),
        role: Role.WORKER,
        status: UserStatus.PENDING,
      });
      expect(result).toMatchObject(createdUser);
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
      ).rejects.toThrow(
        new UserError(UserErrorMessage.INVALID_ROLE, userEntity.id as number),
      );
    });

    it('should throw KycNotApproved if user KYC status is not approved', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: MOCK_EMAIL,
        evmAddress: MOCK_ADDRESS,
        role: Role.WORKER,
        kyc: {
          country: 'FR',
          status: KycStatus.REVIEW,
        },
        save: jest.fn(),
      };

      await expect(
        userService.registerLabeler(userEntity as UserEntity),
      ).rejects.toThrow(
        new UserError(
          UserErrorMessage.KYC_NOT_APPROVED,
          userEntity.id as number,
        ),
      );
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
        new UserError(
          UserErrorMessage.LABELING_ENABLE_FAILED,
          userEntity.id as number,
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
        new UserError(
          UserErrorMessage.LABELING_ENABLE_FAILED,
          userEntity.id as number,
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
        new UserError(
          UserErrorMessage.MISSING_ADDRESS,
          userEntity.id as number,
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

      const signature = await signMessage(
        prepareSignatureBody({
          from: MOCK_ADDRESS,
          to: MOCK_ADDRESS,
          contents: SignatureType.REGISTER_ADDRESS,
          nonce: undefined,
        }),
        MOCK_PRIVATE_KEY,
      );

      // Mock web3Service methods
      web3Service.getSigner = jest.fn().mockReturnValue({
        signMessage: jest.fn().mockResolvedValue(signature),
      });

      const result = await userService.registerAddress(
        userEntity as UserEntity,
        { address: MOCK_ADDRESS, signature },
      );

      expect(userRepository.updateOne).toHaveBeenCalledWith(userEntity);
      expect(result).toEqual({
        key: `KYC-${MOCK_ADDRESS.toLowerCase()}`,
        value: signature,
      });
    });

    it('should fail if user already have a wallet address', async () => {
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
        new UserError(UserErrorMessage.ADDRESS_EXISTS, userEntity.id as number),
      );
    });

    it("should fail if user's kyc is not approved", async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: '',
        kyc: {
          country: 'FR',
          status: KycStatus.REVIEW,
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
        new UserError(
          UserErrorMessage.KYC_NOT_APPROVED,
          userEntity.id as number,
        ),
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
        new UserError(UserErrorMessage.ADDRESS_EXISTS, userEntity.id as number),
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
        new DuplicatedWalletAddressError(userEntity.id as number, address),
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

      await expect(
        userService.registerAddress(userEntity as UserEntity, {
          address,
          signature,
        }),
      ).rejects.toThrow(
        new InvalidWeb3SignatureError(userEntity.id as number, address),
      );
    });
  });

  describe('enableOperator', () => {
    const signatureBody = prepareSignatureBody({
      from: MOCK_ADDRESS,
      to: MOCK_ADDRESS,
      contents: SignatureType.ENABLE_OPERATOR,
    });

    const userEntity: DeepPartial<UserEntity> = {
      id: 1,
      evmAddress: MOCK_ADDRESS,
    };

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should enable an operator', async () => {
      const kvstoreClientMock = {
        set: jest.fn(),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );
      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.INACTIVE);

      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      const result = await userService.enableOperator(
        userEntity as any,
        signature,
      );

      expect(result).toBe(undefined);
      expect(web3Service.getSigner).toHaveBeenCalledWith(ChainId.POLYGON_AMOY);

      expect(KVStoreUtils.get).toHaveBeenCalledWith(
        ChainId.POLYGON_AMOY,
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      );
      expect(kvstoreClientMock.set).toHaveBeenCalledWith(
        MOCK_ADDRESS.toLowerCase(),
        OperatorStatus.ACTIVE,
      );
    });

    it("should throw ConflictException if signature doesn't match", async () => {
      const kvstoreClientMock = {
        set: jest.fn(),
      };
      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );

      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.INACTIVE);

      const invalidSignature = await signMessage(
        'invalid message',
        MOCK_PRIVATE_KEY,
      );

      await expect(
        userService.enableOperator(userEntity as any, invalidSignature),
      ).rejects.toThrow(
        new InvalidWeb3SignatureError(
          userEntity.id as number,
          userEntity.evmAddress as string,
        ),
      );
    });

    it('should throw BadRequestException if operator already enabled in KVStore', async () => {
      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.ACTIVE);

      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      await expect(
        userService.enableOperator(userEntity as any, signature),
      ).rejects.toThrow(
        new UserError(
          UserErrorMessage.OPERATOR_ALREADY_ACTIVE,
          userEntity.id as number,
        ),
      );
    });
  });

  describe('disableOperator', () => {
    const signatureBody = prepareSignatureBody({
      from: MOCK_ADDRESS,
      to: MOCK_ADDRESS,
      contents: SignatureType.DISABLE_OPERATOR,
    });

    const userEntity: DeepPartial<UserEntity> = {
      id: 1,
      evmAddress: MOCK_ADDRESS,
    };

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should disable a user', async () => {
      const kvstoreClientMock = {
        set: jest.fn(),
      };

      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );

      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.ACTIVE);
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      const result = await userService.disableOperator(
        userEntity as any,
        signature,
      );

      expect(result).toBe(undefined);
      expect(web3Service.getSigner).toHaveBeenCalledWith(ChainId.POLYGON_AMOY);

      expect(KVStoreUtils.get).toHaveBeenCalledWith(
        ChainId.POLYGON_AMOY,
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      );
      expect(kvstoreClientMock.set).toHaveBeenCalledWith(
        MOCK_ADDRESS.toLowerCase(),
        OperatorStatus.INACTIVE,
      );
    });

    it("should throw ConflictException if signature doesn't match", async () => {
      const kvstoreClientMock = {
        set: jest.fn(),
      };
      (KVStoreClient.build as any).mockImplementationOnce(
        () => kvstoreClientMock,
      );

      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.ACTIVE);

      const invalidSignature = await signMessage(
        'invalid message',
        MOCK_PRIVATE_KEY,
      );

      await expect(
        userService.disableOperator(userEntity as any, invalidSignature),
      ).rejects.toThrow(
        new InvalidWeb3SignatureError(
          userEntity.id as number,
          userEntity.evmAddress as string,
        ),
      );
    });

    it('should throw UserErrorMessage.OPERATOR_NOT_ACTIVE if operator already disabled in KVStore', async () => {
      KVStoreUtils.get = jest.fn().mockResolvedValue(OperatorStatus.INACTIVE);
      const signature = await signMessage(signatureBody, MOCK_PRIVATE_KEY);

      await expect(
        userService.disableOperator(userEntity as any, signature),
      ).rejects.toThrow(
        new UserError(
          UserErrorMessage.OPERATOR_NOT_ACTIVE,
          userEntity.id as number,
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

      const result = prepareSignatureBody({
        from: MOCK_ADDRESS,
        to: MOCK_ADDRESS,
        contents: SignatureType.SIGNUP,
      });

      expect(result).toStrictEqual(expectedData);
    });

    it('should prepare web3 pre register address payload and return typed structured data', async () => {
      const expectedData: SignatureBodyDto = {
        from: MOCK_ADDRESS.toLowerCase(),
        to: MOCK_ADDRESS.toLowerCase(),
        contents: 'register_address',
        nonce: undefined,
      };

      const result = prepareSignatureBody({
        from: MOCK_ADDRESS,
        to: MOCK_ADDRESS,
        contents: SignatureType.REGISTER_ADDRESS,
      });

      expect(result).toStrictEqual(expectedData);
    });
  });

  describe('registrationInExchangeOracle', () => {
    it('should register a new registration in a Exchange Oracle for the user', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
      };

      const oracleRegistration: RegistrationInExchangeOracleDto = {
        oracleAddress: '0xOracleAddress',
        hCaptchaToken: 'hcaptcha-token',
      };

      const siteKeyMock: DeepPartial<SiteKeyEntity> = {
        siteKey: oracleRegistration.oracleAddress,
        type: SiteKeyType.REGISTRATION,
        user: userEntity,
      };
      jest.spyOn(hcaptchaService, 'verifyToken').mockResolvedValueOnce(true);
      jest
        .spyOn(siteKeyRepository, 'findByUserSiteKeyAndType')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(siteKeyRepository, 'createUnique')
        .mockResolvedValueOnce(siteKeyMock as SiteKeyEntity);

      const result = await userService.registrationInExchangeOracle(
        userEntity as UserEntity,
        oracleRegistration.oracleAddress,
      );

      expect(siteKeyRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          siteKey: oracleRegistration.oracleAddress,
          type: SiteKeyType.REGISTRATION,
          user: userEntity,
        }),
      );

      expect(result).toEqual(siteKeyMock);
    });

    it('should not register a new oracle for the user and return the existing one', async () => {
      const userEntity: DeepPartial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
      };

      const oracleRegistration: RegistrationInExchangeOracleDto = {
        oracleAddress: '0xOracleAddress',
        hCaptchaToken: 'hcaptcha-token',
      };

      const siteKeyMock: DeepPartial<SiteKeyEntity> = {
        siteKey: oracleRegistration.oracleAddress,
        type: SiteKeyType.REGISTRATION,
        user: userEntity,
      };
      jest.spyOn(hcaptchaService, 'verifyToken').mockResolvedValueOnce(true);
      jest
        .spyOn(siteKeyRepository, 'findByUserSiteKeyAndType')
        .mockResolvedValueOnce(siteKeyMock as SiteKeyEntity);

      const result = await userService.registrationInExchangeOracle(
        userEntity as UserEntity,
        oracleRegistration.oracleAddress,
      );

      expect(siteKeyRepository.createUnique).not.toHaveBeenCalled();

      expect(result).toEqual(siteKeyMock);
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

      const result = await userService.getRegistrationInExchangeOracles(
        userEntity as UserEntity,
      );

      expect(result).toEqual(['0xOracleAddress1', '0xOracleAddress2']);
    });
  });
});
