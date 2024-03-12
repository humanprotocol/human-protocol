import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  Web3SignInDto,
  Web3SignUpDto,
} from './auth.dto';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { ConfigNames } from '../../common/config';
import { verifySignature } from '../../common/utils/signature';
import { createHash } from 'crypto';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';
import { ChainId, KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { UserRepository } from '../user/user.repository';
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
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendGridService,
    private readonly web3Service: Web3Service,
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
    const userEntity = await this.userService.create(data);

    const tokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.EMAIL,
      user: userEntity,
    });

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

  public async logout(user: UserEntity): Promise<void> {
    await this.authRepository.delete({ userId: user.id });
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
    const auth = await this.authRepository.findOne({ userId: userEntity.id });

    const accessToken = await this.jwtService.signAsync({
      email: userEntity.email,
      evmAddress: userEntity.evmAddress,
      userId: userEntity.id,
      kycStatus: userEntity.kyc?.status,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        evmAddress: userEntity.evmAddress,
        userId: userEntity.id,
        kycStatus: userEntity.kyc?.status,
      },
      {
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    const accessTokenHashed = this.hashToken(accessToken);
    const refreshTokenHashed = this.hashToken(refreshToken);

    if (auth) {
      await this.logout(userEntity);
    }

    await this.authRepository.create({
      user: userEntity,
      refreshToken: refreshTokenHashed,
      accessToken: accessTokenHashed,
    });

    return { accessToken, refreshToken };
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
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.EMAIL,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    this.userService.activate(tokenEntity.user);
    await tokenEntity.remove();
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity || userEntity?.status != UserStatus.PENDING) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    const existingToken = await this.tokenRepository.findOne({
      userId: userEntity.id,
      tokenType: TokenType.EMAIL,
    });

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

  public async web3Signup(data: Web3SignUpDto): Promise<AuthDto> {
    const preSignUpData = this.web3Service.prepareSignatureBody(
      SignatureType.SIGNUP,
      data.address,
    );

    const verified = verifySignature(preSignUpData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

    let kvstore: KVStoreClient;
    const currentWeb3Env = this.configService.get(ConfigNames.WEB3_ENV);
    if (currentWeb3Env === Web3Env.MAINNET) {
      kvstore = await KVStoreClient.build(
        this.web3Service.getSigner(ChainId.POLYGON),
      );
    } else {
      kvstore = await KVStoreClient.build(
        this.web3Service.getSigner(ChainId.POLYGON_MUMBAI),
      );
    }

    if (
      ![Role.JobLauncher, Role.ExchangeOracle, Role.RecordingOracle].includes(
        await kvstore.get(data.address, KVStoreKeys.role),
      )
    ) {
      throw new BadRequestException(ErrorAuth.InvalidRole);
    }

    const userEntity = await this.userService.createWeb3User(
      data.address,
      data.type,
    );

    await kvstore.set(data.address, 'ACTIVE');

    return this.auth(userEntity);
  }

  public async getNonce(address: string): Promise<string> {
    const userEntity = await this.userService.getByAddress(address);

    return userEntity.nonce;
  }

  public async web3Signin(data: Web3SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByAddress(data.address);

    const verified = verifySignature(userEntity.nonce, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }
}
