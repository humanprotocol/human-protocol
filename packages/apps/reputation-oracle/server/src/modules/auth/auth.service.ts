import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  OperatorStatus,
  Role as UserRole,
  UserStatus,
} from '../../common/enums/user';
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
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';
import {
  ChainId,
  KVStoreClient,
  KVStoreKeys,
  KVStoreUtils,
  Role,
} from '@human-protocol/sdk';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { UserRepository } from '../user/user.repository';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SiteKeyType } from '../../common/enums';
import {
  AuthError,
  AuthErrorMessage,
  DuplicatedUserError,
  InvalidOperatorFeeError,
  InvalidOperatorJobTypesError,
  InvalidOperatorRoleError,
  InvalidOperatorUrlError,
} from './auth.errors';

@Injectable()
export class AuthService {
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly sendgridService: SendGridService,
    private readonly web3Service: Web3Service,
    private readonly userRepository: UserRepository,
  ) {}

  public async signin({ email, password }: SignInDto): Promise<AuthDto> {
    const userEntity = await this.userRepository.findOneByEmail(email);
    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    if (!UserService.checkPasswordMatchesHash(password, userEntity.password)) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    return this.auth(userEntity);
  }

  public async signup(data: UserCreateDto): Promise<UserEntity> {
    const storedUser = await this.userRepository.findOneByEmail(data.email);
    if (storedUser) {
      throw new DuplicatedUserError(data.email);
    }
    const userEntity = await this.userService.create(data);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.user = userEntity;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
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
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
    }

    return this.auth(tokenEntity.user);
  }

  public async auth(userEntity: UserEntity): Promise<AuthDto> {
    const refreshTokenEntity =
      await this.tokenRepository.findOneByUserIdAndType(
        userEntity.id,
        TokenType.REFRESH,
      );

    let chainId: ChainId;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      chainId = ChainId.POLYGON;
    } else if (currentWeb3Env === Web3Env.LOCALHOST) {
      chainId = ChainId.LOCALHOST;
    } else {
      chainId = ChainId.POLYGON_AMOY;
    }

    let status = userEntity.status.toString();
    if (userEntity.role === UserRole.OPERATOR && userEntity.evmAddress) {
      let operatorStatus: string | undefined;
      try {
        operatorStatus = await KVStoreUtils.get(
          chainId,
          this.web3Service.getOperatorAddress(),
          userEntity.evmAddress.toLowerCase(),
        );
      } catch {}

      if (operatorStatus && operatorStatus !== '') {
        status = operatorStatus;
      }
    }

    const payload: any = {
      email: userEntity.email,
      status,
      userId: userEntity.id,
      wallet_address: userEntity.evmAddress,
      role: userEntity.role,
      kyc_status: userEntity.kyc?.status,
      reputation_network: this.web3Service.getOperatorAddress(),
      qualifications: userEntity.userQualifications
        ? userEntity.userQualifications.map(
            (userQualification) => userQualification.qualification.reference,
          )
        : [],
    };

    if (userEntity.siteKeys && userEntity.siteKeys.length > 0) {
      const existingHcaptchaSiteKey = userEntity.siteKeys.find(
        (key) => key.type === SiteKeyType.HCAPTCHA,
      );
      if (existingHcaptchaSiteKey) {
        payload.site_key = existingHcaptchaSiteKey.siteKey;
      }
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
    const userEntity = await this.userRepository.findOneByEmail(data.email);

    if (!userEntity) {
      return;
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
      date.getTime() + this.authConfigService.forgotPasswordExpiresIn * 1000,
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

  public async restorePassword(data: RestorePasswordDto): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.PASSWORD,
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
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
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
    }

    tokenEntity.user.status = UserStatus.ACTIVE;
    await this.userRepository.updateOne(tokenEntity.user);
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userRepository.findOneByEmail(data.email);
    if (!userEntity || userEntity.status !== UserStatus.PENDING) {
      return;
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
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
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

  public async web3Signup(data: Web3SignUpDto): Promise<AuthDto> {
    const preSignUpData = await this.userService.prepareSignatureBody(
      SignatureType.SIGNUP,
      data.address,
    );

    const verified = verifySignature(preSignUpData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    let chainId: ChainId;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      chainId = ChainId.POLYGON;
    } else if (currentWeb3Env === Web3Env.LOCALHOST) {
      chainId = ChainId.LOCALHOST;
    } else {
      chainId = ChainId.POLYGON_AMOY;
    }

    const signer = this.web3Service.getSigner(chainId);
    const kvstore = await KVStoreClient.build(signer);

    let role = '';
    try {
      role = await KVStoreUtils.get(chainId, data.address, KVStoreKeys.role);
    } catch {}

    const validRolesValue = [
      Role.JobLauncher,
      Role.ExchangeOracle,
      Role.RecordingOracle,
    ].map((role) => role.toLowerCase());

    if (!validRolesValue.includes(role.toLowerCase())) {
      throw new InvalidOperatorRoleError(role);
    }

    let fee = '';
    try {
      fee = await KVStoreUtils.get(chainId, data.address, KVStoreKeys.fee);
    } catch {}

    if (!fee) {
      throw new InvalidOperatorFeeError(fee);
    }

    let url = '';
    try {
      url = await KVStoreUtils.get(chainId, data.address, KVStoreKeys.url);
    } catch {}

    if (!url) {
      throw new InvalidOperatorUrlError(url);
    }

    let jobTypes = '';
    try {
      jobTypes = await KVStoreUtils.get(
        chainId,
        data.address,
        KVStoreKeys.jobTypes,
      );
    } catch {}

    if (!jobTypes) {
      throw new InvalidOperatorJobTypesError(jobTypes);
    }

    const userEntity = await this.userService.createWeb3User(data.address);

    await kvstore.set(data.address.toLowerCase(), OperatorStatus.ACTIVE);

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
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }
}
