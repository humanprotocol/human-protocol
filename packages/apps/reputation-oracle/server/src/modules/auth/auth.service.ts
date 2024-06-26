import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ErrorAuth, ErrorUser } from '../../common/constants/errors';
import { OperatorStatus, UserStatus } from '../../common/enums/user';
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
import { verifySignature } from '../../common/utils/signature';
import { createHash } from 'crypto';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';
import { ChainId, KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { UserRepository } from '../user/user.repository';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';

@Injectable()
export class AuthService {
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly hCaptchaConfigService: HCaptchaConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly sendgridService: SendGridService,
    private readonly web3Service: Web3Service,
    private readonly userRepository: UserRepository,
    private readonly hCaptchaService: HCaptchaService,
  ) {}

  public async signin(data: SignInDto, ip?: string): Promise<AuthDto> {
    if (
      !(await this.hCaptchaService.verifyToken({ token: data.hCaptchaToken }))
        .success
    ) {
      throw new ControlledError(
        ErrorAuth.InvalidToken,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new ControlledError(
        ErrorAuth.InvalidEmailOrPassword,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auth(userEntity);
  }

  public async signup(data: UserCreateDto, ip?: string): Promise<UserEntity> {
    if (
      !(await this.hCaptchaService.verifyToken({ token: data.hCaptchaToken }))
        .success
    ) {
      throw new ControlledError(
        ErrorAuth.InvalidToken,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const storedUser = await this.userRepository.findByEmail(data.email);
    if (storedUser) {
      throw new ControlledError(
        ErrorUser.DuplicatedEmail,
        HttpStatus.BAD_REQUEST,
      );
    }
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

    const payload: any = {
      email: userEntity.email,
      userId: userEntity.id,
      address: userEntity.evmAddress,
      role: userEntity.role,
      kyc_status: userEntity.kyc?.status,
      reputation_network: this.web3Service.getOperatorAddress(),
    };

    if (userEntity.siteKey) {
      payload.site_key = userEntity.siteKey.siteKey;
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.authConfigService.accessTokenExpiresIn,
    });

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
    if (
      !(await this.hCaptchaService.verifyToken({ token: data.hCaptchaToken }))
        .success
    ) {
      throw new ControlledError(
        ErrorAuth.InvalidToken,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userEntity = await this.userRepository.findByEmail(data.email);

    if (!userEntity) {
      throw new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT);
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
    if (
      !(await this.hCaptchaService.verifyToken({ token: data.hCaptchaToken }))
        .success
    ) {
      throw new ControlledError(
        ErrorAuth.InvalidToken,
        HttpStatus.UNAUTHORIZED,
      );
    }

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
    if (
      !(await this.hCaptchaService.verifyToken({ token: data.hCaptchaToken }))
        .success
    ) {
      throw new ControlledError(
        ErrorAuth.InvalidToken,
        HttpStatus.UNAUTHORIZED,
      );
    }

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

  public hashToken(token: string): string {
    const hash = createHash('sha256');
    hash.update(token + this.salt);
    return hash.digest('hex');
  }

  public compareToken(token: string, hashedToken: string): boolean {
    return this.hashToken(token) === hashedToken;
  }

  public async web3Signup(data: Web3SignUpDto): Promise<AuthDto> {
    const preSignUpData = await this.userService.prepareSignatureBody(
      SignatureType.SIGNUP,
      data.address,
    );

    const verified = verifySignature(preSignUpData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }

    let kvstore: KVStoreClient;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      kvstore = await KVStoreClient.build(
        this.web3Service.getSigner(ChainId.POLYGON),
      );
    } else {
      kvstore = await KVStoreClient.build(
        this.web3Service.getSigner(ChainId.POLYGON_AMOY),
      );
    }

    if (
      ![Role.JobLauncher, Role.ExchangeOracle, Role.RecordingOracle].includes(
        await kvstore.get(data.address, KVStoreKeys.role),
      )
    ) {
      throw new ControlledError(ErrorAuth.InvalidRole, HttpStatus.BAD_REQUEST);
    }

    const userEntity = await this.userService.createWeb3User(data.address);

    await kvstore.set(data.address, OperatorStatus.ACTIVE);

    return this.auth(userEntity);
  }

  public async web3Signin(data: Web3SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByAddress(data.address);

    const verified = verifySignature(
      await this.userService.prepareSignatureBody(
        SignatureType.SIGNIN,
        data.address,
      ),
      data.signature,
      [data.address],
    );

    if (!verified) {
      throw new ControlledError(
        ErrorAuth.InvalidSignature,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }
}
