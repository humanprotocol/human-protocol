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
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  Logger,
  UsePipes,
  Ip,
} from '@nestjs/common';
import { Public } from '../../common/decorators';
import { UserCreateDto } from '../user/user.dto';
import {
  AuthDto,
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
  Web3SignUpDto,
  Web3SignInDto,
  RefreshDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { TokenRepository } from './token.repository';
import { PasswordValidationPipe } from '../../common/pipes';
import { TokenType } from './token.entity';

@ApiTags('Auth')
@ApiResponse({
  status: 400,
  description: 'Bad Request. Invalid input parameters.',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized. Missing or invalid credentials.',
})
@ApiResponse({
  status: 404,
  description: 'Not Found. Could not find the requested content.',
})
@ApiResponse({
  status: 422,
  description: 'Unprocessable entity.',
})
@Controller('/auth')
export class AuthJwtController {
  private readonly logger = new Logger(AuthJwtController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  @UsePipes(new PasswordValidationPipe())
  @Public()
  @Post('/signup')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'User Signup',
    description: 'Endpoint to register a new user.',
  })
  @ApiBody({ type: UserCreateDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  public async signup(
    @Body() data: UserCreateDto,
    @Ip() ip: string,
  ): Promise<void> {
    await this.authService.signup(data, ip);
    return;
  }

  @Public()
  @Post('/signin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'User Signin',
    description: 'Endpoint for user authentication.',
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: AuthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public signin(@Body() data: SignInDto, @Ip() ip: string): Promise<AuthDto> {
    return this.authService.signin(data, ip);
  }

  @Public()
  @Post('/web3/signup')
  @ApiOperation({
    summary: 'Web3 User Signup',
    description: 'Endpoint for Web3 user registration.',
  })
  @ApiBody({ type: Web3SignUpDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: AuthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async web3SignUp(@Body() data: Web3SignUpDto): Promise<AuthDto> {
    return this.authService.web3Signup(data);
  }

  @Public()
  @Post('/web3/signin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Web3 User Signin',
    description: 'Endpoint for Web3 user authentication.',
  })
  @ApiBody({ type: Web3SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: AuthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async web3SignIn(@Body() data: Web3SignInDto): Promise<AuthDto> {
    return this.authService.web3Signin(data);
  }
  @Public()
  @HttpCode(200)
  @Post('/refresh')
  @ApiBody({ type: RefreshDto })
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Endpoint to refresh the authentication token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthDto,
  })
  async refreshToken(@Body() data: RefreshDto): Promise<AuthDto> {
    return this.authService.refresh(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post('/logout')
  @ApiOperation({
    summary: 'User Logout',
    description: 'Endpoint to log out the user.',
  })
  @ApiResponse({
    status: 204,
    description: 'User logged out successfully',
  })
  public async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.tokenRepository.deleteOneByTypeAndUserId(
      TokenType.REFRESH,
      request.user.id,
    );
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Endpoint to initiate the password reset process.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Password reset email sent successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(data);
  }

  @Public()
  @Post('/restore-password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Restore Password',
    description: 'Endpoint to restore the user password after reset.',
  })
  @ApiBody({ type: RestorePasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Password restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public restorePassword(
    @Body() data: RestorePasswordDto,
    @Ip() ip: string,
  ): Promise<void> {
    return this.authService.restorePassword(data, ip);
  }

  @Public()
  @HttpCode(200)
  @Post('/email-verification')
  @ApiOperation({
    summary: 'Email Verification',
    description: 'Endpoint to verify the user email address.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verification successful',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public async emailVerification(@Body() data: VerifyEmailDto): Promise<void> {
    await this.authService.emailVerification(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post('/resend-email-verification')
  @ApiOperation({
    summary: 'Resend Email Verification',
    description: 'Endpoint to resend the email verification link.',
  })
  @ApiBody({ type: ResendEmailVerificationDto })
  @ApiResponse({
    status: 204,
    description: 'Email verification resent successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public resendEmailVerification(
    @Body() data: ResendEmailVerificationDto,
  ): Promise<void> {
    return this.authService.resendEmailVerification(data);
  }
}
