/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Injectable } from '@nestjs/common';
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

import { AuthConfigService } from '../../common/config/auth-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';

import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { generateHash } from '../../common/utils/crypto';
import { ApiKeyRepository } from './apikey.repository';
import * as crypto from 'crypto';
import { verifyToken } from '../../common/utils/hcaptcha';
import { UserRepository } from '../user/user.repository';
import { ApiKeyEntity } from './apikey.entity';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly sendgridService: SendGridService,
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  public async signin(data: SignInDto, ip?: string): Promise<AuthDto> {
    // if (
    //   !(
    //     await verifyToken(
    //       this.authConfigService.hCaptchaExchangeURL,
    //       this.authConfigService.hCaptchaSiteKey,
    //       this.authConfigService.hCaptchaSecret,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new ControlledError(ErrorAuth.InvalidCaptchaToken, HttpStatus.UNAUTHORIZED);
    // }
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new ControlledError(
        ErrorAuth.InvalidEmailOrPassword,
        HttpStatus.FORBIDDEN,
      );
    }

    return this.auth(userEntity);
  }

  public async signup(data: UserCreateDto, ip?: string): Promise<UserEntity> {
    // if (
    //   !(
    //     await verifyToken(
    //       this.authConfigService.hCaptchaExchangeURL,
    //       this.authConfigService.hCaptchaSiteKey,
    //       this.authConfigService.hCaptchaSecret,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new ControlledError(ErrorAuth.InvalidCaptchaToken, HttpStatus.UNAUTHORIZED);
    // }
    const userEntity = await this.userService.create(data);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
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
      throw new ControlledError(ErrorAuth.InvalidToken, HttpStatus.FORBIDDEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN);
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
        expiresIn: this.authConfigService.accessTokenExpiresIn,
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
      date.getTime() + this.authConfigService.refreshTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(newRefreshTokenEntity);

    return { accessToken, refreshToken: newRefreshTokenEntity.uuid };
  }

  public async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userRepository.findByEmail(data.email);

    if (!userEntity) {
      throw new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new ControlledError(ErrorUser.UserNotActive, HttpStatus.FORBIDDEN);
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
      date.getTime() + this.authConfigService.forgotPasswordExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.serverConfigService.feURL}/reset-password?token=${tokenEntity.uuid}`,
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
    //       this.authConfigService.hCaptchaExchangeURL,
    //       this.authConfigService.hCaptchaSiteKey,
    //       this.authConfigService.hCaptchaSecret,
    //       data.hCaptchaToken,
    //       ip,
    //     )
    //   ).success
    // ) {
    //   throw new ControlledError(ErrorAuth.InvalidCaptchaToken, HttpStatus.UNAUTHORIZED);
    // }

    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.PASSWORD,
    );

    if (!tokenEntity) {
      throw new ControlledError(ErrorAuth.InvalidToken, HttpStatus.FORBIDDEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN);
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
      throw new ControlledError(ErrorAuth.NotFound, HttpStatus.FORBIDDEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN);
    }

    tokenEntity.user.status = UserStatus.ACTIVE;
    await this.userRepository.updateOne(tokenEntity.user);
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userRepository.findByEmail(data.email);

    if (!userEntity || userEntity?.status != UserStatus.PENDING) {
      throw new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT);
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
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(tokenEntity);

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.signup,
    });
  }

  async createOrUpdateAPIKey(user: UserEntity): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const apiKey = crypto.randomBytes(32).toString('hex');
    const hashedAPIKey = await generateHash(
      apiKey,
      salt,
      this.authConfigService.apiKeyIterations,
      this.authConfigService.apiKeyLength,
    );

    let apiKeyEntity = await this.apiKeyRepository.findAPIKeyByUserId(user.id);
    if (!apiKeyEntity) {
      apiKeyEntity = new ApiKeyEntity();
      apiKeyEntity.user = user;
      apiKeyEntity.hashedAPIKey = hashedAPIKey;
      apiKeyEntity.salt = salt;

      await this.apiKeyRepository.createUnique(apiKeyEntity);
    } else {
      apiKeyEntity.hashedAPIKey = hashedAPIKey;
      apiKeyEntity.salt = salt;

      this.apiKeyRepository.updateOne(apiKeyEntity);
    }

    apiKeyEntity.hashedAPIKey = hashedAPIKey;
    apiKeyEntity.salt = salt;

    this.apiKeyRepository.updateOne(apiKeyEntity);

    return `${apiKey}-${apiKeyEntity.id}`;
  }

  async validateAPIKey(userId: number, apiKey: string): Promise<boolean> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyByUserId(userId);

    if (!apiKeyEntity) {
      throw new ControlledError(ErrorAuth.ApiKeyNotFound, HttpStatus.FORBIDDEN);
    }

    const hash = await generateHash(
      apiKey,
      apiKeyEntity.salt,
      this.authConfigService.apiKeyIterations,
      this.authConfigService.apiKeyLength,
    );

    return hash === apiKeyEntity.hashedAPIKey;
  }

  async validateAPIKeyAndGetUser(
    apiKeyId: number,
    apiKey: string,
  ): Promise<UserEntity | null> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyById(apiKeyId);

    if (!apiKeyEntity) {
      throw new ControlledError(ErrorAuth.ApiKeyNotFound, HttpStatus.FORBIDDEN);
    }
    const hash = await generateHash(
      apiKey,
      apiKeyEntity.salt,
      this.authConfigService.apiKeyIterations,
      this.authConfigService.apiKeyLength,
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
