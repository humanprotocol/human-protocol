import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DatabaseModule } from '../../src/database/database.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserRepository } from '../../src/modules/user/user.repository';
import { TokenRepository } from '../../src/modules/auth/token.repository';
import { TokenType } from '../../src/modules/auth/token.entity';
import { UserStatus } from '../../src/common/enums/user';

describe('AuthService Integration', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let tokenRepository: TokenRepository;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    tokenRepository = moduleRef.get<TokenRepository>(TokenRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration', () => {
    it('should throw bad request with invalid input parameters', async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@hmt.ai',
          password: 'password',
          h_captcha_token: 'string',
        });

      expect(signUpResponse.status).toBe(400);
    });

    it('should sign up a user successfully', async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@hmt.ai',
          password: 'Password1!',
          h_captcha_token: 'string',
        });

      expect(signUpResponse.status).toBe(201);

      const userEntity = await userRepository.findByEmail('test@hmt.ai');
      expect(userEntity).toBeDefined();
    });

    it('should throw duplicate key value violates unique constraint', async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@hmt.ai',
          password: 'Password1!',
          h_captcha_token: 'string',
        });

      expect(signUpResponse.status).toBe(422);
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test2@hmt.ai',
          password: 'Password1!',
          h_captcha_token: 'string',
        });

      expect(signUpResponse.status).toBe(201);

      const userEntity = await userRepository.findByEmail('test2@hmt.ai');
      expect(userEntity!.status).toBe(UserStatus.PENDING);

      const tokenEntity = await tokenRepository.findOneByUserIdAndType(
        userEntity!.id,
        TokenType.EMAIL,
      );

      const verifyTokenResponse = await request(app.getHttpServer())
        .post(`/auth/email-verification`)
        .send({ token: tokenEntity!.uuid });

      expect(verifyTokenResponse.status).toBe(200);

      const updatedUserEntity =
        await userRepository.findByEmail('test2@hmt.ai');
      expect(updatedUserEntity!.status).toBe(UserStatus.ACTIVE);
    });

    it('should throw an error if token does not exist', async () => {
      const token = 123;

      const verifyTokenResponse = await request(app.getHttpServer())
        .post(`/auth/email-verification`)
        .send({ token });

      expect(verifyTokenResponse.status).toBe(400);
    });
  });

  describe('User Authentication', () => {
    it('should sign in a user successfully', async () => {
      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'test@hmt.ai',
          password: 'Password1!',
          h_captcha_token: 'string',
        });

      expect(signInResponse.status).toBe(200);

      const userEntity = await userRepository.findByEmail('test@hmt.ai');
      const tokenEntity = await tokenRepository.findOneByUserIdAndType(
        userEntity!.id,
        TokenType.REFRESH,
      );

      expect(tokenEntity).toBeDefined();
    });

    it('should throw an error for invalid email or password', async () => {
      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'test@hmt.ai',
          password: 'Incorrect',
          h_captcha_token: 'string',
        });

      expect(signInResponse.status).toBe(403);
    });
  });
});
