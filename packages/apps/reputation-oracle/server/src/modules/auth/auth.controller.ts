import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
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
} from '@nestjs/common';
import { Public } from '../../common/decorators';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards';
import { HCaptchaGuard } from '../../common/guards/hcaptcha';
import { RequestWithUser } from '../../common/interfaces/request';
import { TokenRepository } from './token.repository';
import { TokenType } from './token.entity';
import { AuthControllerErrorsFilter } from './auth.error.filter';
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
} from './dto';

@ApiTags('Auth')
@Controller('/auth')
@UseFilters(AuthControllerErrorsFilter)
export class AuthJwtController {
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
    await this.authService.signup(data);
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
    const authTokens = await this.authService.signin(data);
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
    await this.authService.forgotPassword(data);
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
    await this.authService.restorePassword(data);
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
    await this.authService.emailVerification(data);
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
  @UseGuards(HCaptchaGuard, JwtAuthGuard)
  @Post('/web2/resend-verification-email')
  @HttpCode(200)
  async resendEmailVerification(
    @Body() data: ResendVerificationEmailDto,
  ): Promise<void> {
    await this.authService.resendEmailVerification(data);
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
    const authTokens = await this.authService.web3Signup(data);
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
    const authTokens = await this.authService.web3Signin(data);
    return authTokens;
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
    const authTokens = await this.authService.refresh(data);
    return authTokens;
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
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(200)
  async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.tokenRepository.deleteOneByTypeAndUserId(
      TokenType.REFRESH,
      request.user.id,
    );
  }
}
