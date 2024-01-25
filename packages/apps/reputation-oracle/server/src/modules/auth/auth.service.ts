import {
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
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
  Web3SignInDto,
  Web3SignUpDto,
} from './auth.dto';
import { TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { ConfigNames } from '../../common/config';
import { verifySignature } from '../../common/utils/signature';
import { createHash } from 'crypto';
import { SendGridService } from '../sendgrid/sendgrid.service';
import {
  WEB3_SIGNUP_MESSAGE,
  SENDGRID_TEMPLATES,
  SERVICE_NAME,
} from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresIn: string;
  private readonly salt: string;
  private readonly feURL: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendGridService,
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
  }

  public async signin(data: SignInDto): Promise<AuthDto> {
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

  public async signup(data: UserCreateDto): Promise<UserEntity> {
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
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    if (userEntity.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException(ErrorAuth.UserNotActive);

    const existingToken = await this.tokenRepository.findOne({
      userId: userEntity.id,
      tokenType: TokenType.PASSWORD,
    });

    if (existingToken) {
      await existingToken.remove();
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

  public async restorePassword(data: RestorePasswordDto): Promise<boolean> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.PASSWORD,
    });

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

    await tokenEntity.remove();

    return true;
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
    const verified = await verifySignature(
      WEB3_SIGNUP_MESSAGE,
      data.signature,
      [data.address],
    );

    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

    const userEntity = await this.userService.createWeb3User(
      data.address,
      data.type,
    );

    return this.auth(userEntity);
  }

  public async getNonce(address: string): Promise<string> {
    const userEntity = await this.userService.getByAddress(address);

    return userEntity.nonce;
  }

  public async web3Signin(data: Web3SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByAddress(data.address);

    const verified = await verifySignature(userEntity.nonce, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }
}
