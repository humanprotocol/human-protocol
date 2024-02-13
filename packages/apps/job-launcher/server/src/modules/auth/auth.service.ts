/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ErrorAuth, ErrorUser } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { UserCreateDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  AuthDto,
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';

import { ConfigNames } from '../../common/config';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { generateHash } from '../../common/utils/crypto';
import { ApiKeyRepository } from './apikey.repository';
import * as crypto from 'crypto';
import { verifyToken } from '../../common/utils/hcaptcha';
import { AuthRepository } from './auth.repository';
import { AuthEntity } from './auth.entity';
import { UserRepository } from '../user/user.repository';
import { ApiKeyEntity } from './apikey.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresIn: string;
  private readonly salt: string;
  private readonly feURL: string;
  private readonly iterations: number;
  private readonly keyLength: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendGridService,
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.refreshTokenExpiresIn = this.configService.get<string>(
      ConfigNames.JWT_REFRESH_TOKEN_EXPIRES_IN,
      '100000000',
    );

    this.salt = this.configService.get<string>(
      ConfigNames.HASH_SECRET,
      'a328af3fc1dad15342cc3d68936008fa',
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
      throw new NotFoundException(ErrorAuth.InvalidEmailOrPassword);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ErrorAuth.UserNotActive);
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

    let tokenEntity = new TokenEntity();
    tokenEntity.tokenType = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    tokenEntity = await this.tokenRepository.createUnique(tokenEntity);

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

  public async auth(userEntity: UserEntity): Promise<AuthDto> {
    const auth = await this.authRepository.findOneByUserId(userEntity.id);

    const accessToken = await this.jwtService.signAsync({
      email: userEntity.email,
      userId: userEntity.id,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        userId: userEntity.id,
      },
      {
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    const accessTokenHashed = this.hashToken(accessToken);
    const refreshTokenHashed = this.hashToken(refreshToken);

    if (auth) {
      await this.authRepository.deleteByUserId(userEntity.id);
    }

    const authEntity = new AuthEntity();
    authEntity.user = userEntity;
    authEntity.refreshToken = refreshTokenHashed;
    authEntity.accessToken = accessTokenHashed;

    await this.authRepository.createUnique(authEntity);

    return { accessToken, refreshToken };
  }

  public async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    if (userEntity.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException(ErrorAuth.UserNotActive);

    const existingToken =
      await this.tokenRepository.findOneByUserIdAndTokenType(
        userEntity.id,
        TokenType.PASSWORD,
      );

    if (existingToken) {
      await this.tokenRepository.deleteOne(existingToken);
    }

    const newTokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.PASSWORD,
      user: userEntity,
    });

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.feURL}/reset-password?token=${newTokenEntity.uuid}`,
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

    const tokenEntity = await this.tokenRepository.findOneByUuidAndTokenType(
      data.token,
      TokenType.PASSWORD,
    );

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
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
    const tokenEntity = await this.tokenRepository.findOneByUuidAndTokenType(
      data.token,
      TokenType.EMAIL,
    );

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    tokenEntity.user.status = UserStatus.ACTIVE;
    this.userRepository.updateOne(tokenEntity.user);
    await this.tokenRepository.deleteOne(tokenEntity);
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity || userEntity?.status != UserStatus.PENDING) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    const existingToken =
      await this.tokenRepository.findOneByUserIdAndTokenType(
        userEntity.id,
        TokenType.EMAIL,
      );

    if (existingToken) {
      await existingToken.remove();
    }

    const newTokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.EMAIL,
      user: userEntity,
    });

    await this.sendgridService.sendEmail({
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: {
            service_name: SERVICE_NAME,
            url: `${this.feURL}/verify?token=${newTokenEntity.uuid}`,
          },
        },
      ],
      templateId: SENDGRID_TEMPLATES.signup,
    });
  }

  public hashToken(token: string): string {
    const hash = createHash('sha256');
    hash.update(token + this.salt);
    return hash.digest('hex');
  }

  public compareToken(token: string, hashedToken: string): boolean {
    return this.hashToken(token) === hashedToken;
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
      throw new NotFoundException('API Key Entity not found');
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
      throw new NotFoundException('API Key Entity not found');
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
