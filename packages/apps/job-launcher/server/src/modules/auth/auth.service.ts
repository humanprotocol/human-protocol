/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ErrorAuth, ErrorUser } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { UserCreateDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  AuthDto,
  ForgotPasswordDto,
  RefreshDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';

import { ConfigNames } from '../../common/config';
import { ConfigService } from '@nestjs/config';

import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { generateHash } from '../../common/utils/crypto';
import { ApiKeyRepository } from './apikey.repository';
import * as crypto from 'crypto';
import { verifyToken } from '../../common/utils/hcaptcha';
import { UserRepository } from '../user/user.repository';
import { ApiKeyEntity } from './apikey.entity';
import { AuthError } from './auth.error';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresIn: number;
  private readonly accessTokenExpiresIn: number;
  private readonly verifyEmailTokenExpiresIn: number;
  private readonly forgotPasswordTokenExpiresIn: number;
  private readonly feURL: string;
  private readonly iterations: number;
  private readonly keyLength: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendGridService,
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.refreshTokenExpiresIn = this.configService.get<number>(
      ConfigNames.REFRESH_TOKEN_EXPIRES_IN,
      3600000,
    );

    this.accessTokenExpiresIn = this.configService.get<number>(
      ConfigNames.JWT_ACCESS_TOKEN_EXPIRES_IN,
      300000,
    );

    this.verifyEmailTokenExpiresIn = this.configService.get<number>(
      ConfigNames.VERIFY_EMAIL_TOKEN_EXPIRES_IN,
      1800000,
    );

    this.forgotPasswordTokenExpiresIn = this.configService.get<number>(
      ConfigNames.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
      1800000,
    );

    this.feURL = this.configService.get<string>(
      ConfigNames.FE_URL,
      'http://localhost:3005',
    );
    this.iterations = this.configService.get<number>(
      ConfigNames.APIKEY_ITERATIONS,
      1000,
    );
    this.keyLength = this.configService.get<number>(
      ConfigNames.APIKEY_KEY_LENGTH,
      64,
    );
  }

  public async signin(data: SignInDto, ip?: string): Promise<AuthDto> {
    // if (
    //   !(
    //     await verifyToken(
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_EXCHANGE_URL)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SITE_KEY)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SECRET)!,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new UnauthorizedException(ErrorAuth.InvalidCaptchaToken);
    // }
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new AuthError(ErrorAuth.InvalidEmailOrPassword);
    }

    return this.auth(userEntity);
  }

  public async signup(data: UserCreateDto, ip?: string): Promise<UserEntity> {
    // if (
    //   !(
    //     await verifyToken(
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SITE_KEY)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_EXCHANGE_URL)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SECRET)!,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new UnauthorizedException(ErrorAuth.InvalidCaptchaToken);
    // }
    const userEntity = await this.userService.create(data);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.verifyEmailTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.feURL}/verify?token=${tokenEntity.uuid}`,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.signup,
    });

    return userEntity;
  }

  public async refresh(data: RefreshDto): Promise<AuthDto> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.refreshToken,
      TokenType.REFRESH,
    );

    if (!tokenEntity) {
      throw new AuthError(ErrorAuth.InvalidToken);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(ErrorAuth.TokenExpired);
    }

    return this.auth(tokenEntity.user);
  }

  public async auth(userEntity: UserEntity): Promise<AuthDto> {
    const refreshTokenEntity =
      await this.tokenRepository.findOneByUserIdAndType(
        userEntity.id,
        TokenType.REFRESH,
      );

    const accessToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        userId: userEntity.id,
        status: userEntity.status,
      },
      {
        expiresIn: this.accessTokenExpiresIn,
      },
    );

    if (refreshTokenEntity) {
      await this.tokenRepository.deleteOne(refreshTokenEntity);
    }

    const newRefreshTokenEntity = new TokenEntity();
    newRefreshTokenEntity.user = userEntity;
    newRefreshTokenEntity.type = TokenType.REFRESH;
    const date = new Date();
    newRefreshTokenEntity.expiresAt = new Date(
      date.getTime() + this.refreshTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(newRefreshTokenEntity);

    return { accessToken, refreshToken: newRefreshTokenEntity.uuid };
  }

  public async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userRepository.findByEmail(data.email);

    if (!userEntity) {
      throw new AuthError(ErrorUser.NotFound);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new AuthError(ErrorUser.UserNotActive);
    }

    const existingToken = await this.tokenRepository.findOneByUserIdAndType(
      userEntity.id,
      TokenType.PASSWORD,
    );

    if (existingToken) {
      await this.tokenRepository.deleteOne(existingToken);
    }

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.PASSWORD;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.forgotPasswordTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.feURL}/reset-password?token=${tokenEntity.uuid}`,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.resetPassword,
    });
  }

  public async restorePassword(
    data: RestorePasswordDto,
    ip?: string,
  ): Promise<void> {
    // if (
    //   !(
    //     await verifyToken(
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_EXCHANGE_URL)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SITE_KEY)!,
    //       this.configService.get<string>(ConfigNames.HCAPTCHA_SECRET)!,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new UnauthorizedException(ErrorAuth.InvalidCaptchaToken);
    // }

    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.PASSWORD,
    );

    if (!tokenEntity) {
      throw new AuthError(ErrorAuth.InvalidToken);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(ErrorAuth.TokenExpired);
    }

    await this.userService.updatePassword(tokenEntity.user, data);
    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: tokenEntity.user.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.passwordChanged,
    });

    await this.tokenRepository.deleteOne(tokenEntity);
  }

  public async emailVerification(data: VerifyEmailDto): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.EMAIL,
    );

    if (!tokenEntity) {
      throw new AuthError(ErrorAuth.NotFound);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(ErrorAuth.TokenExpired);
    }

    tokenEntity.user.status = UserStatus.ACTIVE;
    await this.userRepository.updateOne(tokenEntity.user);
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userRepository.findByEmail(data.email);

    if (!userEntity || userEntity?.status != UserStatus.PENDING) {
      throw new AuthError(ErrorUser.NotFound);
    }

    const existingToken = await this.tokenRepository.findOneByUserIdAndType(
      userEntity.id,
      TokenType.EMAIL,
    );

    if (existingToken) {
      await existingToken.remove();
    }

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.verifyEmailTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.feURL}/verify?token=${tokenEntity.uuid}`,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.signup,
    });
  }

  async createOrUpdateAPIKey(userId: number): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const apiKey = crypto.randomBytes(32).toString('hex');
    const hashedAPIKey = await generateHash(
      apiKey,
      salt,
      this.iterations,
      this.keyLength,
    );

    let apiKeyEntity = await this.apiKeyRepository.findAPIKeyByUserId(userId);
    if (!apiKeyEntity) {
      apiKeyEntity = new ApiKeyEntity();
      apiKeyEntity.user.id = userId;
      await this.apiKeyRepository.createUnique(apiKeyEntity);
    }

    apiKeyEntity.hashedAPIKey = hashedAPIKey;
    apiKeyEntity.salt = salt;

    this.apiKeyRepository.updateOne(apiKeyEntity);

    return `${apiKey}-${apiKeyEntity.id}`;
  }

  async validateAPIKey(userId: number, apiKey: string): Promise<boolean> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyByUserId(userId);

    if (!apiKeyEntity) {
      this.logger.log('API Key Entity not found', AuthService.name);
      throw new AuthError(ErrorAuth.ApiKeyNotFound);
    }

    const hash = await generateHash(
      apiKey,
      apiKeyEntity.salt,
      this.iterations,
      this.keyLength,
    );

    return hash === apiKeyEntity.hashedAPIKey;
  }

  async validateAPIKeyAndGetUser(
    apiKeyId: number,
    apiKey: string,
  ): Promise<UserEntity | null> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyById(apiKeyId);

    if (!apiKeyEntity) {
      this.logger.log('API Key Entity not found', AuthService.name);
      throw new AuthError(ErrorAuth.ApiKeyNotFound);
    }
    const hash = await generateHash(
      apiKey,
      apiKeyEntity.salt,
      this.iterations,
      this.keyLength,
    );

    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(apiKeyEntity.hashedAPIKey),
    );
    if (isValid) {
      return apiKeyEntity.user;
    }

    return null;
  }
}
