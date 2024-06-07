import request from 'supertest';
import * as crypto from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UserRepository } from '../../src/modules/user/user.repository';
import { TokenRepository } from '../../src/modules/auth/token.repository';
import { TokenType } from '../../src/modules/auth/token.entity';
import { UserStatus } from '../../src/common/enums/user';
import setupE2eEnvironment from './env-setup';
import { NetworkConfigService } from '../../src/common/config/network-config.service';
import { Web3ConfigService } from '../../src/common/config/web3-config.service';
import { ChainId } from '@human-protocol/sdk';
import {
  MOCK_PRIVATE_KEY,
  MOCK_WEB3_NODE_HOST,
  MOCK_WEB3_RPC_URL,
} from '../constants';

describe('AuthService E2E', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let tokenRepository: TokenRepository;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it.only('should test authentication workflow', async () => {
    const email = `${crypto.randomBytes(16).toString('hex')}@hmt.ai`;
    const password = 'Password1!';
    const hCaptchaToken = 'string';

    // User Registration
    const signUpResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email,
        password,
        h_captcha_token: hCaptchaToken,
      });
    expect(signUpResponse.status).toBe(201);

    // Verify user registration
    const userEntity = await userRepository.findByEmail(email);
    expect(userEntity).toBeDefined();

    // Email Verification
    expect(userEntity!.status).toBe(UserStatus.PENDING);

    // Invalid verification
    const invalidVerifyTokenResponse = await request(app.getHttpServer())
      .post(`/auth/email-verification`)
      .send({ token: 123 });
    expect(invalidVerifyTokenResponse.status).toBe(400);

    const tokenEntity = await tokenRepository.findOneByUserIdAndType(
      userEntity!.id,
      TokenType.EMAIL,
    );

    // Valid verification
    const verifyTokenResponse = await request(app.getHttpServer())
      .post(`/auth/email-verification`)
      .send({ token: tokenEntity!.uuid });

    expect(verifyTokenResponse.status).toBe(200);

    const updatedUserEntity = await userRepository.findByEmail(email);
    expect(updatedUserEntity!.status).toBe(UserStatus.ACTIVE);

    // User Authentication
    const signInResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password,
        h_captcha_token: hCaptchaToken,
      });
    expect(signInResponse.status).toBe(200);

    const refreshedUserEntity = await userRepository.findByEmail(email);
    const refreshTokenEntity = await tokenRepository.findOneByUserIdAndType(
      refreshedUserEntity!.id,
      TokenType.REFRESH,
    );
    expect(refreshTokenEntity).toBeDefined();

    // Invalid Authentication
    const invalidSignInResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password: 'Incorrect',
        h_captcha_token: hCaptchaToken,
      });
    expect(invalidSignInResponse.status).toBe(403);

    // Refresh Token
    const refreshTokenResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: refreshTokenEntity!.uuid }); // Add appropriate data if needed

    expect(refreshTokenResponse.status).toBe(200);
    expect(refreshTokenResponse.body).toHaveProperty('access_token');
    expect(refreshTokenResponse.body).toHaveProperty('refresh_token');

    const accessToken = refreshTokenResponse.body.access_token;

    // Resend Email Verification
    const resendEmailVerificationResponse = await request(app.getHttpServer())
      .post('/auth/resend-email-verification')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email });
    expect(resendEmailVerificationResponse.status).toBe(204);
  });
});
