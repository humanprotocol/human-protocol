import request from 'supertest';
import * as crypto from 'crypto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UserRepository } from '../../src/modules/user/user.repository';
import { TokenRepository } from '../../src/modules/auth/token.repository';
import { TokenEntity, TokenType } from '../../src/modules/auth/token.entity';
import { UserStatus } from '../../src/common/enums/user';
import { UserService } from '../../src/modules/user/user.service';
import { UserEntity } from '../../src/modules/user/user.entity';
import { ErrorAuth } from '../../src/common/constants/errors';
import setupE2eEnvironment from './env-setup';
import { NetworkConfigService } from '../../src/common/config/network-config.service';
import { Web3ConfigService } from '../../src/common/config/web3-config.service';
import { ChainId } from '@human-protocol/sdk';
import {
  MOCK_PRIVATE_KEY,
  MOCK_WEB3_NODE_HOST,
  MOCK_WEB3_RPC_URL,
} from '../constants';

describe('Restore password E2E workflow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let tokenRepository: TokenRepository;
  let userService: UserService;

  let userEntity: UserEntity;
  let tokenEntity: TokenEntity;

  const email = `${crypto.randomBytes(16).toString('hex')}@hmt.ai`;

  beforeAll(async () => {
    setupE2eEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NetworkConfigService)
      .useValue({
        networks: [
          {
            chainId: ChainId.LOCALHOST,
            rpcUrl: MOCK_WEB3_RPC_URL,
          },
        ],
      })
      .overrideProvider(Web3ConfigService)
      .useValue({
        privateKey: MOCK_PRIVATE_KEY,
        env: MOCK_WEB3_NODE_HOST,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    tokenRepository = moduleFixture.get<TokenRepository>(TokenRepository);
    userService = moduleFixture.get<UserService>(UserService);

    userEntity = await userService.create({
      email,
      password: 'Password1!',
      hCaptchaToken: 'string',
    });

    userEntity.status = UserStatus.ACTIVE;
    await userEntity.save();

    tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(date.getTime() + 100000);

    await tokenRepository.createUnique(tokenEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should restore password successfully', async () => {
    // Call forgot password endpoint
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(HttpStatus.NO_CONTENT);

    // Ensure old token was deleted and a new token was created
    const oldTokenExists = await tokenRepository.findOneByUuidAndType(
      tokenEntity.uuid,
      TokenType.PASSWORD,
    );
    expect(oldTokenExists).toBeNull();

    const newToken = await tokenRepository.findOneByUserIdAndType(
      userEntity.id,
      TokenType.PASSWORD,
    );
    expect(newToken).toBeDefined();

    // Call restore password endpoint
    const restorePasswordData = {
      password: 'NewPassword1!',
      token: newToken!.uuid,
      hCaptchaToken: 'string',
    };
    await request(app.getHttpServer())
      .post('/auth/restore-password')
      .send(restorePasswordData)
      .expect(HttpStatus.NO_CONTENT);

    // Ensure password was updated
    const updatedUser = await userRepository.findById(userEntity!.id);
    expect(updatedUser!.password).not.toEqual(userEntity.password);

    userEntity = updatedUser!;

    // Ensure new token was deleted
    const deletedToken = await tokenRepository.findOneByUuidAndType(
      newToken!.uuid,
      TokenType.PASSWORD,
    );
    expect(deletedToken).toBeNull();
  });

  it('should handle invalid token error', async () => {
    // Call forgot password endpoint
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(HttpStatus.NO_CONTENT);

    // Delete the new token
    await tokenRepository.delete(tokenEntity.id);

    // Call restore password endpoint with invalid token
    const invalidToken = '00000000-0000-0000-0000-000000000000';
    const restorePasswordData = {
      password: 'NewPassword2!',
      token: invalidToken,
      hCaptchaToken: 'string',
    };

    const invalidRestorePasswordResponse = await request(app.getHttpServer())
      .post('/auth/restore-password')
      .send(restorePasswordData)
      .expect(HttpStatus.FORBIDDEN);

    expect(invalidRestorePasswordResponse.status).toBe(HttpStatus.FORBIDDEN);
    expect(invalidRestorePasswordResponse.body.message).toBe(
      ErrorAuth.InvalidToken,
    );

    // Ensure password was not updated
    const updatedUser = await userRepository.findById(userEntity.id);
    expect(updatedUser!.password).toEqual(userEntity.password);
  });

  it('should handle token expired error', async () => {
    // Call forgot password endpoint
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(HttpStatus.NO_CONTENT);

    // Expire the new token
    const date = new Date();
    const expiredToken = await tokenRepository.findOneByUserIdAndType(
      userEntity.id,
      TokenType.PASSWORD,
    );
    expiredToken!.expiresAt = new Date(date.getTime() - 100000); // Set token expiration in the past
    await expiredToken!.save();

    // Call restore password endpoint with expired token
    const expiredTokenValue = expiredToken!.uuid;
    const restorePasswordData = {
      password: 'NewPassword2!',
      token: expiredTokenValue,
      hCaptchaToken: 'string',
    };
    const invalidRestorePasswordResponse = await request(app.getHttpServer())
      .post('/auth/restore-password')
      .send(restorePasswordData);

    expect(invalidRestorePasswordResponse.status).toBe(HttpStatus.FORBIDDEN);
    expect(invalidRestorePasswordResponse.body.message).toBe(
      ErrorAuth.TokenExpired,
    );

    // Ensure password was not updated
    const updatedUser = await userRepository.findById(userEntity.id);
    expect(updatedUser!.password).toEqual(userEntity.password);
  });
});
