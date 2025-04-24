jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { KVStoreKeys, KVStoreUtils, Role } from '@human-protocol/sdk';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { omit } from 'lodash';

import { generateES256Keys } from '../../../test/fixtures/crypto';
import { generateEthWallet } from '../../../test/fixtures/web3';
import { SignatureType } from '../../common/enums';
import { AuthConfigService } from '../../config/auth-config.service';
import { NDAConfigService } from '../../config/nda-config.service';
import { ServerConfigService } from '../../config/server-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import * as secutiryUtils from '../../utils/security';
import { SiteKeyRepository } from '../user/site-key.repository';
import * as web3Utils from '../../utils/web3';
import { EmailAction } from '../email/constants';
import { EmailService } from '../email/email.service';
import {
  UserStatus,
  UserRole,
  UserEntity,
  UserRepository,
  UserService,
} from '../user';
import { generateOperator, generateWorkerUser } from '../user/fixtures';
import { mockWeb3ConfigService } from '../web3/fixtures';
import * as AuthErrors from './auth.error';
import { AuthService } from './auth.service';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';

const mockKVStoreUtils = jest.mocked(KVStoreUtils);

const { publicKey, privateKey } = generateES256Keys();
const mockAuthConfigService = {
  jwtPrivateKey: privateKey,
  jwtPublicKey: publicKey,
  accessTokenExpiresIn: 600,
  refreshTokenExpiresIn: 3600000,
  verifyEmailTokenExpiresIn: 86400000,
  forgotPasswordExpiresIn: 86400000,
  humanAppEmail: faker.internet.email(),
};

const mockEmailService = createMock<EmailService>();

const mockNdaConfigService = {
  latestNdaUrl: faker.internet.url(),
};

const mockServerConfigService = {
  feURL: faker.internet.url(),
};

const mockSiteKeyRepository = createMock<SiteKeyRepository>();
const mockTokenRepository = createMock<TokenRepository>();
const mockUserRepository = createMock<UserRepository>();
const mockUserService = createMock<UserService>();

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.registerAsync({
          useFactory: () => ({
            privateKey: mockAuthConfigService.jwtPrivateKey,
            signOptions: {
              algorithm: 'ES256',
              expiresIn: mockAuthConfigService.accessTokenExpiresIn,
            },
          }),
        }),
      ],
      providers: [
        { provide: AuthConfigService, useValue: mockAuthConfigService },
        AuthService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: NDAConfigService, useValue: mockNdaConfigService },
        { provide: ServerConfigService, useValue: mockServerConfigService },
        { provide: SiteKeyRepository, useValue: mockSiteKeyRepository },
        { provide: TokenRepository, useValue: mockTokenRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: Web3ConfigService, useValue: mockWeb3ConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const email = faker.internet.email();
      const password = faker.string.alphanumeric();
      const userId = faker.number.int();
      const tokenUuid = faker.string.uuid();

      mockUserRepository.findOneByEmail.mockResolvedValueOnce(null);
      mockUserRepository.createUnique.mockResolvedValueOnce({
        id: userId,
      } as UserEntity);
      mockTokenRepository.createUnique.mockResolvedValueOnce({
        uuid: tokenUuid,
      } as TokenEntity);

      await service.signup(email, password);

      expect(mockUserRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          role: UserRole.WORKER,
          status: UserStatus.PENDING,
        }),
      );

      const user = mockUserRepository.createUnique.mock.calls[0][0];
      expect(
        secutiryUtils.comparePasswordWithHash(
          password,
          user.password as string,
        ),
      ).toBe(true);

      expect(mockTokenRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockTokenRepository.createUnique).toHaveBeenCalledWith({
        type: TokenType.EMAIL,
        userId,
        expiresAt: expect.any(Date),
      });

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        email,
        EmailAction.SIGNUP,
        {
          url: `${mockServerConfigService.feURL}/verify?token=${tokenUuid}`,
        },
      );
    });

    it('should throw a DuplicatedUserEmailError', async () => {
      const email = faker.internet.email();
      const password = faker.string.alphanumeric();

      mockUserRepository.findOneByEmail.mockResolvedValueOnce({
        email,
      } as UserEntity);

      await expect(service.signup(email, password)).rejects.toThrow(
        new AuthErrors.DuplicatedUserEmailError(email),
      );
    });
  });

  describe('web3Signup', () => {
    it('should create a new operator', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === KVStoreKeys.role) {
            return Role.ExchangeOracle;
          }
          if (key === KVStoreKeys.fee) {
            return String(faker.number.int({ min: 1, max: 50 }));
          }
          if (key === KVStoreKeys.url) {
            return faker.internet.url();
          }

          throw new Error('Invalid key');
        },
      );

      const spyOnWeb3Auth = jest
        .spyOn(service, 'web3Auth')
        .mockImplementation();
      spyOnWeb3Auth.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.web3Signup(signature, ethWallet.address);

      expect(mockUserRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          evmAddress: ethWallet.address.toLowerCase(),
          nonce: expect.any(String),
          role: UserRole.OPERATOR,
          status: UserStatus.ACTIVE,
        }),
      );

      expect(service.web3Auth).toHaveBeenCalledTimes(1);

      spyOnWeb3Auth.mockRestore();
    });

    it('should throw DuplicatedUserAddressError', async () => {
      const ethWallet = generateEthWallet();
      const signature = faker.string.alpha();
      mockUserRepository.findOneByAddress.mockImplementationOnce(
        async (address) => {
          if (address === ethWallet.address) {
            return {
              evmAddress: ethWallet.address,
            } as UserEntity;
          }
          return null;
        },
      );

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(
        new AuthErrors.DuplicatedUserAddressError(ethWallet.address),
      );
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE)', async () => {
      const ethWallet = generateEthWallet();
      const signature = faker.string.alpha();
      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_WEB3_SIGNATURE,
        ),
      );
    });

    it('should throw InvalidOperatorRoleError for invalid role', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      const mockedRole = faker.string.alpha();
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === KVStoreKeys.role) {
            return mockedRole;
          }

          throw new Error('Invalid key');
        },
      );

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(new AuthErrors.InvalidOperatorRoleError(mockedRole));
    });

    it('should throw InvalidOperatorRoleError when role is not set', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      const mockedRole = faker.string.alpha();
      mockKVStoreUtils.get.mockImplementation(async () => {
        throw new Error('Invalid key');
      });

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(new AuthErrors.InvalidOperatorRoleError(mockedRole));
    });

    it('should throw InvalidOperatorFeeError for invalid fee', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === KVStoreKeys.role) {
            return Role.ExchangeOracle;
          }
          if (key === KVStoreKeys.fee) {
            return '';
          }

          throw new Error('Invalid key');
        },
      );

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(new AuthErrors.InvalidOperatorFeeError(''));
    });

    it('should throw InvalidOperatorFeeError when fee is not set', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === KVStoreKeys.role) {
            return Role.ExchangeOracle;
          }

          throw new Error('Invalid key');
        },
      );

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(new AuthErrors.InvalidOperatorFeeError(''));
    });

    it.each([
      '',
      `${faker.string.alpha()}.test`,
      `ftp://${faker.string.alpha()}.test`,
    ])(
      'should throw InvalidOperatorUrlError for invalid url [%#]',
      async (invalidUrl) => {
        const ethWallet = generateEthWallet();
        const signatureBody = web3Utils.prepareSignatureBody({
          from: ethWallet.address,
          to: mockWeb3ConfigService.operatorAddress,
          contents: SignatureType.SIGNUP,
        });
        const signature = await web3Utils.signMessage(
          signatureBody,
          ethWallet.privateKey,
        );

        mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
        mockKVStoreUtils.get.mockImplementation(
          async (_chainId, _address, key) => {
            if (key === KVStoreKeys.role) {
              return Role.ExchangeOracle;
            }
            if (key === KVStoreKeys.fee) {
              return String(faker.number.int({ min: 1, max: 50 }));
            }
            if (key === KVStoreKeys.url) {
              return invalidUrl;
            }

            throw new Error('Invalid key');
          },
        );

        await expect(
          service.web3Signup(signature, ethWallet.address),
        ).rejects.toThrow(new AuthErrors.InvalidOperatorUrlError(invalidUrl));
      },
    );

    it('should throw InvalidOperatorFeeError when url is not set', async () => {
      const ethWallet = generateEthWallet();
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNUP,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserRepository.findOneByAddress.mockResolvedValueOnce(null);
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === KVStoreKeys.role) {
            return Role.ExchangeOracle;
          }
          if (key === KVStoreKeys.fee) {
            return String(faker.number.int({ min: 1, max: 50 }));
          }

          throw new Error('Invalid key');
        },
      );

      await expect(
        service.web3Signup(signature, ethWallet.address),
      ).rejects.toThrow(new AuthErrors.InvalidOperatorFeeError(''));
    });
  });

  describe('signin', () => {
    it('should signin user', async () => {
      const password = faker.string.alphanumeric();
      const user = generateWorkerUser({ password });

      mockUserService.findWeb2UserByEmail.mockResolvedValueOnce(user);

      const spyOnAuth = jest.spyOn(service, 'auth').mockImplementation();
      spyOnAuth.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.signin(user.email, password);

      expect(service.auth).toHaveBeenCalledTimes(1);
      expect(service.auth).toHaveBeenCalledWith(user);

      spyOnAuth.mockRestore();
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_CREDENTIALS) if user not found', async () => {
      const email = faker.internet.email();
      const password = faker.string.alphanumeric();

      mockUserService.findWeb2UserByEmail.mockResolvedValueOnce(null);

      await expect(service.signin(email, password)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_CREDENTIALS,
        ),
      );
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_CREDENTIALS) if password does not match', async () => {
      const invalidPassword = faker.string.alphanumeric();
      const user = generateWorkerUser();

      mockUserService.findWeb2UserByEmail.mockResolvedValueOnce(user);

      await expect(service.signin(user.email, invalidPassword)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_CREDENTIALS,
        ),
      );
    });

    it('should throw InactiveUserError if user status is `inactive`', async () => {
      const password = faker.string.alphanumeric();
      const user = generateWorkerUser({
        password,
        status: UserStatus.INACTIVE,
      });

      mockUserService.findWeb2UserByEmail.mockResolvedValueOnce(user);

      await expect(service.signin(user.email, password)).rejects.toThrow(
        new AuthErrors.InactiveUserError(user.id),
      );
    });
  });

  describe('web3Signin', () => {
    it('should signin operator', async () => {
      const ethWallet = generateEthWallet();
      const operator = generateOperator({ privateKey: ethWallet.privateKey });
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNIN,
        nonce: operator.nonce,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserService.findOperatorUser.mockResolvedValueOnce(operator);

      const spyOnWeb3Auth = jest
        .spyOn(service, 'web3Auth')
        .mockImplementation();
      spyOnWeb3Auth.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.web3Signin(ethWallet.address, signature);

      expect(mockUserRepository.updateOneById).toHaveBeenCalledWith(
        operator.id,
        { nonce: expect.any(String) },
      );
      expect(service.web3Auth).toHaveBeenCalledTimes(1);
      expect(service.web3Auth).toHaveBeenCalledWith(operator);

      spyOnWeb3Auth.mockRestore();
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_ADDRESS)', async () => {
      const ethWallet = generateEthWallet();
      const signature = faker.string.alpha();

      mockUserService.findOperatorUser.mockResolvedValueOnce(null);

      await expect(
        service.web3Signin(ethWallet.address, signature),
      ).rejects.toThrow(
        new AuthErrors.AuthError(AuthErrors.AuthErrorMessage.INVALID_ADDRESS),
      );
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE)', async () => {
      const invalidSignature = faker.string.alphanumeric();
      const operator = generateOperator();

      mockUserService.findOperatorUser.mockResolvedValueOnce(operator);

      await expect(
        service.web3Signin(operator.evmAddress, invalidSignature),
      ).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_WEB3_SIGNATURE,
        ),
      );
    });

    it('should throw InactiveUserError if operator status in DB is `inactive`', async () => {
      const ethWallet = generateEthWallet();
      const operator = generateOperator({
        privateKey: ethWallet.privateKey,
        status: UserStatus.INACTIVE,
      });
      const signatureBody = web3Utils.prepareSignatureBody({
        from: ethWallet.address,
        to: mockWeb3ConfigService.operatorAddress,
        contents: SignatureType.SIGNIN,
        nonce: operator.nonce,
      });
      const signature = await web3Utils.signMessage(
        signatureBody,
        ethWallet.privateKey,
      );

      mockUserService.findOperatorUser.mockResolvedValueOnce(operator);

      await expect(
        service.web3Signin(operator.evmAddress, signature),
      ).rejects.toThrow(new AuthErrors.InactiveUserError(operator.id));
    });
  });

  describe('auth', () => {
    it('should generate jwt payload for worker', async () => {
      const user = generateWorkerUser();

      mockSiteKeyRepository.findByUserAndType.mockResolvedValueOnce([]);

      const expectedJwtPayload = {
        email: user.email,
        status: user.status,
        user_id: user.id,
        wallet_address: user.evmAddress,
        role: user.role,
        kyc_status: user.kyc?.status,
        nda_signed: user.ndaSignedUrl === mockNdaConfigService.latestNdaUrl,
        reputation_network: mockWeb3ConfigService.operatorAddress,
        qualifications: user.userQualifications
          ? user.userQualifications.map(
              (userQualification) => userQualification.qualification?.reference,
            )
          : [],
      };

      const spyOnGenerateTokens = jest
        .spyOn(service, 'generateTokens')
        .mockImplementation();
      spyOnGenerateTokens.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.auth(user);

      expect(service.generateTokens).toHaveBeenCalledTimes(1);
      expect(service.generateTokens).toHaveBeenCalledWith(
        user.id,
        expectedJwtPayload,
      );

      spyOnGenerateTokens.mockRestore();
    });
  });

  describe('web3Auth', () => {
    it('should generate jwt payload for operator', async () => {
      const operator = generateOperator();

      const mockedOperatorStatus = 'active';
      const expectedJwtPayload = {
        status: operator.status,
        user_id: operator.id,
        wallet_address: operator.evmAddress,
        role: operator.role,
        reputation_network: mockWeb3ConfigService.operatorAddress,
        operator_status: mockedOperatorStatus,
      };

      const spyOnGenerateTokens = jest
        .spyOn(service, 'generateTokens')
        .mockImplementation();
      spyOnGenerateTokens.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });
      mockKVStoreUtils.get.mockImplementation(
        async (_chainId, _address, key) => {
          if (key === operator.evmAddress) {
            return mockedOperatorStatus;
          }

          throw new Error('Invalid key');
        },
      );

      await service.web3Auth(operator);

      expect(service.generateTokens).toHaveBeenCalledTimes(1);
      expect(service.generateTokens).toHaveBeenCalledWith(
        operator.id,
        expectedJwtPayload,
      );

      spyOnGenerateTokens.mockRestore();
    });

    it('should generate jwt payload for operator when status is not set', async () => {
      const operator = generateOperator();

      const expectedJwtPayload = {
        status: operator.status,
        user_id: operator.id,
        wallet_address: operator.evmAddress,
        role: operator.role,
        reputation_network: mockWeb3ConfigService.operatorAddress,
        operator_status: 'inactive',
      };

      const spyOnGenerateTokens = jest
        .spyOn(service, 'generateTokens')
        .mockImplementation();
      spyOnGenerateTokens.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });
      mockKVStoreUtils.get.mockImplementation(async () => {
        throw new Error('Invalid key');
      });

      await service.web3Auth(operator);

      expect(service.generateTokens).toHaveBeenCalledTimes(1);
      expect(service.generateTokens).toHaveBeenCalledWith(
        operator.id,
        expectedJwtPayload,
      );

      spyOnGenerateTokens.mockRestore();
    });
  });

  describe('generateTokens', () => {
    it.each([null, { uuid: faker.string.uuid() }])(
      'should generate access and refresh tokens for worker [%#]',
      async (existingRefreshToken) => {
        const user = generateWorkerUser();

        const jwtPayload = {
          email: user.email,
          status: user.status,
          user_id: user.id,
          wallet_address: user.evmAddress,
          role: user.role,
          kyc_status: user.kyc?.status,
          nda_signed: user.ndaSignedUrl === mockNdaConfigService.latestNdaUrl,
          reputation_network: mockWeb3ConfigService.operatorAddress,
          qualifications: user.userQualifications
            ? user.userQualifications.map(
                (userQualification) =>
                  userQualification.qualification?.reference,
              )
            : [],
        };

        mockTokenRepository.findOneByUserIdAndType.mockResolvedValueOnce(
          existingRefreshToken as TokenEntity,
        );

        const { accessToken } = await service.generateTokens(
          user.id,
          jwtPayload,
        );

        if (existingRefreshToken) {
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledTimes(1);
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledWith(
            existingRefreshToken as TokenEntity,
          );
        }

        const decodedAccessToken = await jwtService.verifyAsync(accessToken, {
          secret: mockAuthConfigService.jwtPrivateKey,
        });

        expect(omit(decodedAccessToken, ['exp', 'iat'])).toEqual(jwtPayload);
      },
    );
  });

  describe('refresh', () => {
    it('should generate tokens for worker', async () => {
      const user = generateWorkerUser();
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.future(),
      } as TokenEntity);

      mockUserRepository.findOneById.mockResolvedValueOnce(user);

      const spyOnAuth = jest.spyOn(service, 'auth').mockImplementation();
      spyOnAuth.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.refresh(uuid);

      expect(service.auth).toHaveBeenCalledTimes(1);
      expect(service.auth).toHaveBeenCalledWith(user);

      spyOnAuth.mockRestore();
    });

    it('should generate tokens for operator', async () => {
      const operator = generateOperator();
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.future(),
      } as TokenEntity);

      mockUserRepository.findOneById.mockResolvedValueOnce(operator);

      const spyOnWeb3Auth = jest
        .spyOn(service, 'web3Auth')
        .mockImplementation();
      spyOnWeb3Auth.mockResolvedValueOnce({
        accessToken: faker.string.alpha(),
        refreshToken: faker.string.uuid(),
      });

      await service.refresh(uuid);

      expect(service.web3Auth).toHaveBeenCalledTimes(1);
      expect(service.web3Auth).toHaveBeenCalledWith(operator);

      spyOnWeb3Auth.mockRestore();
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN) if token not found', async () => {
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.refresh(uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_REFRESH_TOKEN,
        ),
      );
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN) if user not found', async () => {
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.future(),
      } as TokenEntity);

      mockUserRepository.findOneById.mockResolvedValueOnce(null);

      await expect(service.refresh(uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_REFRESH_TOKEN,
        ),
      );
    });

    it('should throw AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED)', async () => {
      const uuid = faker.string.uuid();
      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.past(),
      } as TokenEntity);
      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.refresh(uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.REFRESH_TOKEN_EXPIRED,
        ),
      );
    });
  });

  describe('forgotPassword', () => {
    it.each([null, { uuid: faker.string.uuid() }])(
      'should create a password token and send an email [%#]',
      async (existingForgotPasswordToken) => {
        const user = generateWorkerUser();
        const tokenUuid = faker.string.uuid();

        mockUserRepository.findOneByEmail.mockResolvedValueOnce(user);
        mockTokenRepository.findOneByUserIdAndType.mockResolvedValueOnce(
          existingForgotPasswordToken as TokenEntity,
        );
        mockTokenRepository.createUnique.mockResolvedValueOnce({
          uuid: tokenUuid,
        } as TokenEntity);

        await service.forgotPassword(user.email);

        if (existingForgotPasswordToken) {
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledTimes(1);
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledWith(
            existingForgotPasswordToken as TokenEntity,
          );
        }
        expect(mockTokenRepository.createUnique).toHaveBeenCalledTimes(1);
        expect(mockTokenRepository.createUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            type: TokenType.PASSWORD,
            userId: user.id,
          }),
        );
        expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          user.email,
          EmailAction.RESET_PASSWORD,
          {
            url: `${mockServerConfigService.feURL}/reset-password?token=${tokenUuid}`,
          },
        );
      },
    );

    it('should do nothing if email not found', async () => {
      const email = faker.internet.email();
      mockUserRepository.findOneByEmail.mockResolvedValueOnce(null);

      await service.forgotPassword(email);

      expect(mockTokenRepository.findOneByUserIdAndType).not.toHaveBeenCalled();
      expect(mockTokenRepository.deleteOne).not.toHaveBeenCalled();
      expect(mockTokenRepository.createUnique).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('restorePassword', () => {
    it('should change password and delete password token', async () => {
      const newPassword = faker.string.alphanumeric();
      const mockToken = {
        user: {
          email: faker.internet.email(),
        },
        userId: faker.number.int(),
        uuid: faker.string.uuid(),
        expiresAt: faker.date.future(),
      };

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(
        mockToken as TokenEntity,
      );

      mockUserRepository.updateOneById.mockResolvedValueOnce(true);

      await service.restorePassword(newPassword, mockToken.uuid);

      expect(mockUserRepository.updateOneById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateOneById).toHaveBeenCalledWith(
        mockToken.userId,
        {
          password: expect.any(String),
        },
      );

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        mockToken.user.email,
        EmailAction.PASSWORD_CHANGED,
      );

      expect(mockTokenRepository.deleteOne).toHaveBeenCalledTimes(1);
      expect(mockTokenRepository.deleteOne).toHaveBeenCalledWith(mockToken);
    });

    it('should not send an email and delete password token if password change unsuccessful', async () => {
      const newPassword = faker.string.alphanumeric();
      const mockToken = {
        user: {
          email: faker.internet.email(),
        },
        userId: faker.number.int(),
        uuid: faker.string.uuid(),
        expiresAt: faker.date.future(),
      };

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(
        mockToken as TokenEntity,
      );

      mockUserRepository.updateOneById.mockResolvedValueOnce(false);

      await service.restorePassword(newPassword, mockToken.uuid);

      expect(mockUserRepository.updateOneById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateOneById).toHaveBeenCalledWith(
        mockToken.userId,
        {
          password: expect.any(String),
        },
      );

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
      expect(mockTokenRepository.deleteOne).not.toHaveBeenCalled();
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_PASSWORD_TOKEN) if token not found', async () => {
      const newPassword = faker.string.alphanumeric();
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.restorePassword(newPassword, uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_PASSWORD_TOKEN,
        ),
      );
    });

    it('should throw AuthError(AuthErrorMessage.PASSWORD_TOKEN_EXPIRED)', async () => {
      const newPassword = faker.string.alphanumeric();
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.past(),
      } as TokenEntity);
      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.restorePassword(newPassword, uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.PASSWORD_TOKEN_EXPIRED,
        ),
      );
    });
  });

  describe('emailVerification', () => {
    it('should verify an email', async () => {
      const mockToken = {
        userId: faker.number.int(),
        uuid: faker.string.uuid(),
        type: TokenType.EMAIL,
        expiresAt: faker.date.future(),
      };

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(
        mockToken as TokenEntity,
      );

      await service.emailVerification(mockToken.uuid);

      expect(mockUserRepository.updateOneById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateOneById).toHaveBeenCalledWith(
        mockToken.userId,
        {
          status: UserStatus.ACTIVE,
        },
      );
    });

    it('should throw AuthError(AuthErrorMessage.INVALID_EMAIL_TOKEN) if token not found', async () => {
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.emailVerification(uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.INVALID_EMAIL_TOKEN,
        ),
      );
    });

    it('should throw AuthError(AuthErrorMessage.EMAIL_TOKEN_EXPIRED)', async () => {
      const uuid = faker.string.uuid();

      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce({
        uuid,
        expiresAt: faker.date.past(),
      } as TokenEntity);
      mockTokenRepository.findOneByUuidAndType.mockResolvedValueOnce(null);

      await expect(service.emailVerification(uuid)).rejects.toThrow(
        new AuthErrors.AuthError(
          AuthErrors.AuthErrorMessage.EMAIL_TOKEN_EXPIRED,
        ),
      );
    });
  });

  describe('resendEmailVerification', () => {
    it.each([null, { uuid: faker.string.uuid() }])(
      'should send a verification email [%#]',
      async (existingEmailToken) => {
        const user = generateWorkerUser({ status: UserStatus.PENDING });
        const tokenUuid = faker.string.uuid();

        mockUserRepository.findOneByEmail.mockResolvedValueOnce(user);
        mockTokenRepository.findOneByUserIdAndType.mockResolvedValueOnce(
          existingEmailToken as TokenEntity,
        );
        mockTokenRepository.createUnique.mockResolvedValueOnce({
          uuid: tokenUuid,
        } as TokenEntity);

        await service.resendEmailVerification(user);

        if (existingEmailToken) {
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledTimes(1);
          expect(mockTokenRepository.deleteOne).toHaveBeenCalledWith(
            existingEmailToken as TokenEntity,
          );
        }
        expect(mockTokenRepository.createUnique).toHaveBeenCalledTimes(1);
        expect(mockTokenRepository.createUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            type: TokenType.EMAIL,
            userId: user.id,
          }),
        );
        expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          user.email,
          EmailAction.SIGNUP,
          {
            url: `${mockServerConfigService.feURL}/verify?token=${tokenUuid}`,
          },
        );
      },
    );

    it.each([UserStatus.INACTIVE, UserStatus.ACTIVE])(
      'should do nothing if user is not in PENDING status [%#]',
      async (userStatus) => {
        const user = generateWorkerUser({ status: userStatus });

        mockUserRepository.findOneByEmail.mockResolvedValueOnce(null);

        await service.resendEmailVerification(user);

        expect(
          mockTokenRepository.findOneByUserIdAndType,
        ).not.toHaveBeenCalled();
        expect(mockTokenRepository.deleteOne).not.toHaveBeenCalled();
        expect(mockTokenRepository.createUnique).not.toHaveBeenCalled();
        expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
      },
    );
  });
});
