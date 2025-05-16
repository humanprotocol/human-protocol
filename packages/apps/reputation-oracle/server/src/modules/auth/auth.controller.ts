import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UseFilters,
  HttpCode,
  Headers,
} from '@nestjs/common';

import { Public } from '../../common/decorators';
import { RequestWithUser } from '../../common/types';
import { HCaptchaGuard } from '../../integrations/hcaptcha/hcaptcha.guard';

import { AuthService } from './auth.service';
import { AuthControllerErrorsFilter } from './auth.error-filter';
import { HEADER_M2M_AUTH } from './constants';
import {
  ForgotPasswordDto,
  SuccessAuthDto,
  RefreshDto,
  ResendVerificationEmailDto,
  RestorePasswordDto,
  VerifyEmailDto,
  Web2SignUpDto,
  Web2SignInDto,
  Web3SignInDto,
  Web3SignUpDto,
  SuccessM2mAuthDto,
} from './dto';
import { TokenRepository } from './token.repository';
import { TokenType } from './token.entity';

@ApiTags('Auth')
@Controller('/auth')
@UseFilters(AuthControllerErrorsFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  @ApiOperation({
    summary: 'User signup',
    description: 'Endpoint to register a new user',
  })
  @ApiBody({ type: Web2SignUpDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User with provided email already registered',
  })
  @Public()
  @UseGuards(HCaptchaGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/web2/signup')
  @HttpCode(200)
  async signup(@Body() data: Web2SignUpDto): Promise<void> {
    await this.authService.signup(data.email, data.password);
  }

  @ApiOperation({
    summary: 'Web3 user signup',
    description: 'Endpoint for Web3 user registration',
  })
  @ApiBody({ type: Web3SignUpDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: SuccessAuthDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with provided address already registered',
  })
  @Public()
  @Post('/web3/signup')
  @HttpCode(200)
  async web3SignUp(@Body() data: Web3SignUpDto): Promise<SuccessAuthDto> {
    const authTokens = await this.authService.web3Signup(
      data.signature,
      data.address,
    );
    return authTokens;
  }

  @ApiOperation({
    summary: 'User signin',
    description: 'Endpoint for user authentication',
  })
  @ApiBody({ type: Web2SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: SuccessAuthDto,
  })
  @Public()
  @UseGuards(HCaptchaGuard)
  @Post('/web2/signin')
  @HttpCode(200)
  async signin(@Body() data: Web2SignInDto): Promise<SuccessAuthDto> {
    const authTokens = await this.authService.signin(data.email, data.password);
    return authTokens;
  }

  @ApiOperation({
    summary: 'Web3 user signin',
    description: 'Endpoint for Web3 user authentication',
  })
  @ApiBody({ type: Web3SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: SuccessAuthDto,
  })
  @Public()
  @Post('/web3/signin')
  @HttpCode(200)
  async web3SignIn(@Body() data: Web3SignInDto): Promise<SuccessAuthDto> {
    const authTokens = await this.authService.web3Signin(
      data.address,
      data.signature,
    );
    return authTokens;
  }

  @ApiOperation({
    summary: 'M2M signin',
    description: 'Endpoint for machine-to-machine authentication',
  })
  @ApiHeader({
    name: HEADER_M2M_AUTH,
    description:
      'Basic auth with base64url secret key as username only credential',
    required: true,
    example: 'sk_example_a-base64urlSafe-string-Xi8dQHy1SvcPm307lps',
  })
  @ApiResponse({
    status: 200,
    description: 'Service authenticated successfully',
    type: SuccessAuthDto,
  })
  @Public()
  @Post('/m2m/signin')
  @HttpCode(200)
  async m2mSignIn(
    @Headers(HEADER_M2M_AUTH) secretKey: string,
  ): Promise<SuccessM2mAuthDto> {
    const accessToken = await this.authService.m2mSignin(secretKey);
    return { accessToken };
  }

  @ApiBody({ type: RefreshDto })
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Endpoint to refresh the authentication token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: SuccessAuthDto,
  })
  @Public()
  @Post('/refresh')
  @HttpCode(200)
  async refreshToken(@Body() data: RefreshDto): Promise<SuccessAuthDto> {
    const authTokens = await this.authService.refresh(data.refreshToken);
    return authTokens;
  }

  @ApiOperation({
    summary: 'Forgot password',
    description: 'Endpoint to initiate the password reset process',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
  })
  @Public()
  @UseGuards(HCaptchaGuard)
  @Post('/web2/forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(data.email);
  }

  @ApiOperation({
    summary: 'Restore password',
    description: 'Endpoint to restore the user password after reset',
  })
  @ApiBody({ type: RestorePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password restored successfully',
  })
  @Public()
  @UseGuards(HCaptchaGuard)
  @Post('/web2/restore-password')
  @HttpCode(200)
  async restorePassword(@Body() data: RestorePasswordDto): Promise<void> {
    await this.authService.restorePassword(data.password, data.token);
  }

  @ApiOperation({
    summary: 'Email verification',
    description: 'Endpoint to verify the user email address',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @Public()
  @Post('/web2/verify-email')
  @HttpCode(200)
  async emailVerification(@Body() data: VerifyEmailDto): Promise<void> {
    await this.authService.emailVerification(data.token);
  }

  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Endpoint to resend the verification email',
  })
  @ApiBody({ type: ResendVerificationEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
  })
  @ApiBearerAuth()
  @UseGuards(HCaptchaGuard)
  @Post('/web2/resend-verification-email')
  @HttpCode(200)
  async resendEmailVerification(
    @Req() request: RequestWithUser,
  ): Promise<void> {
    await this.authService.resendEmailVerification(request.user.id);
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Endpoint to log out the user',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @ApiBearerAuth()
  @Post('/logout')
  @HttpCode(200)
  async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.tokenRepository.deleteOneByTypeAndUserId(
      TokenType.REFRESH,
      request.user.id,
    );
  }
}
