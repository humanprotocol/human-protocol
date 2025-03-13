import {
  KVStoreClient,
  KVStoreKeys,
  KVStoreUtils,
  Role,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { OperatorStatus } from '../../common/enums/user';
import {
  SiteKeyType,
  UserStatus,
  UserRole,
  UserEntity,
  UserRepository,
  UserService,
  type Web2UserEntity,
  type OperatorUserEntity,
} from '../user';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import { verifySignature } from '../../utils/web3';
import { Web3Service } from '../web3/web3.service';
import { SignatureType } from '../../common/enums/web3';
import { prepareSignatureBody } from '../../utils/web3';
import { AuthConfigService } from '../../config/auth-config.service';
import { NDAConfigService } from '../../config/nda-config.service';
import { ServerConfigService } from '../../config/server-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import {
  AuthError,
  AuthErrorMessage,
  DuplicatedUserAddressError,
  DuplicatedUserEmailError,
  InvalidOperatorFeeError,
  InvalidOperatorJobTypesError,
  InvalidOperatorRoleError,
  InvalidOperatorUrlError,
} from './auth.error';
import {
  ForgotPasswordDto,
  SuccessAuthDto,
  RefreshDto,
  Web2SignUpDto,
  Web2SignInDto,
  Web3SignInDto,
  Web3SignUpDto,
  RestorePasswordDto,
  VerifyEmailDto,
  ResendVerificationEmailDto,
} from './dto';

import { EmailService } from '../email/email.service';
import { EmailAction } from '../email/constants';

@Injectable()
export class AuthService {
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly ndaConfigService: NDAConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly emailService: EmailService,
    private readonly web3Service: Web3Service,
    private readonly userRepository: UserRepository,
  ) {}

  public async signin({
    email,
    password,
  }: Web2SignInDto): Promise<SuccessAuthDto> {
    const userEntity = await this.userService.findWeb2UserByEmail(email);
    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    if (!UserService.checkPasswordMatchesHash(password, userEntity.password)) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    return this.auth(userEntity);
  }

  public async signup(data: Web2SignUpDto): Promise<void> {
    const storedUser = await this.userRepository.findOneByEmail(data.email);
    if (storedUser) {
      throw new DuplicatedUserEmailError(data.email);
    }
    const userEntity = await this.userService.createWorkerUser(data);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
    });
  }

  public async refresh(data: RefreshDto): Promise<SuccessAuthDto> {
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

    const userEntity = await this.userRepository.findOneById(
      tokenEntity.userId,
      {
        relations: {
          kyc: true,
          siteKeys: true,
        },
      },
    );

    if (!userEntity) {
      throw new Error('User not found');
    }

    return this.auth(userEntity);
  }

  public async auth(
    userEntity: Web2UserEntity | OperatorUserEntity | UserEntity,
  ): Promise<SuccessAuthDto> {
    const refreshTokenEntity =
      await this.tokenRepository.findOneByUserIdAndType(
        userEntity.id,
        TokenType.REFRESH,
      );

    const operatorAddress = this.web3ConfigService.operatorAddress;

    let status = userEntity.status.toString();
    if (userEntity.role === UserRole.OPERATOR && userEntity.evmAddress) {
      let operatorStatus: string | undefined;
      try {
        operatorStatus = await KVStoreUtils.get(
          this.web3ConfigService.reputationNetworkChainId,
          operatorAddress,
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
      nda_signed:
        userEntity.ndaSignedUrl === this.ndaConfigService.latestNdaUrl,
      reputation_network: operatorAddress,
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
    newRefreshTokenEntity.userId = userEntity.id;
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
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.forgotPasswordExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.RESET_PASSWORD, {
      url: `${this.serverConfigService.feURL}/reset-password?token=${tokenEntity.uuid}`,
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

    const userEntity = await this.userService.updatePassword(
      tokenEntity.userId,
      data.password,
    );
    await this.emailService.sendEmail(
      userEntity.email,
      EmailAction.PASSWORD_CHANGED,
    );

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

    await this.userRepository.updateOneById(tokenEntity.userId, {
      status: UserStatus.ACTIVE,
    });
  }

  public async resendEmailVerification(
    data: ResendVerificationEmailDto,
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
      await this.tokenRepository.deleteOne(existingToken);
    }

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
    });
  }

  public async web3Signup(data: Web3SignUpDto): Promise<SuccessAuthDto> {
    const preSignUpData = prepareSignatureBody({
      from: data.address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNUP,
    });

    const verified = verifySignature(preSignUpData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    const chainId = this.web3ConfigService.reputationNetworkChainId;

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

    const user = await this.userRepository.findOneByAddress(data.address);

    if (user) {
      throw new DuplicatedUserAddressError(data.address);
    }

    const userEntity = await this.userService.createOperatorUser(data.address);

    /**
     * TODO: revisit if we want to make it active by default
     * since we have `enableOperator` functionality and
     * they might not have enough tokens, which should not impact signup
     */
    await kvstore.set(data.address.toLowerCase(), OperatorStatus.ACTIVE);

    return this.auth(userEntity);
  }

  public async web3Signin(data: Web3SignInDto): Promise<SuccessAuthDto> {
    const userEntity = await this.userService.findOperatorUser(data.address);

    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_ADDRESS);
    }

    const preSigninData = prepareSignatureBody({
      from: data.address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNIN,
      nonce: userEntity.nonce,
    });
    const verified = verifySignature(preSigninData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    await this.userService.updateNonce(userEntity);

    return this.auth(userEntity);
  }
}
