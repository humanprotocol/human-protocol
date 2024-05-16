import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  Request,
  Logger,
  UsePipes,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { UserCreateDto } from '../user/user.dto';
import {
  ApiKeyDto,
  AuthDto,
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
  RefreshDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ErrorAuth } from '../../common/constants/errors';
import { PasswordValidationPipe } from '../../common/pipes';
import { TokenRepository } from './token.repository';
import { TokenType } from './token.entity';
import { ControlledError } from '../../common/errors/controlled';

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
    status: 201,
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
  }

  @Public()
  @HttpCode(200)
  @Post('/signin')
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
  public signin(@Body() data: SignInDto, @Ip() ip: string): Promise<AuthDto> {
    return this.authService.signin(data, ip);
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
  public async refreshToken(@Body() data: RefreshDto): Promise<AuthDto> {
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
  @HttpCode(204)
  @Post('/forgot-password')
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
  public async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(data);
  }

  @Public()
  @HttpCode(204)
  @Post('/restore-password')
  @ApiOperation({
    summary: 'Restore Password',
    description: 'Endpoint to restore the user password after reset.',
  })
  @ApiBody({ type: RestorePasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Password restored successfully',
  })
  public async restorePassword(
    @Body() data: RestorePasswordDto,
    @Ip() ip: string,
  ): Promise<void> {
    await this.authService.restorePassword(data, ip);
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
  public async resendEmailVerification(
    @Body() data: ResendEmailVerificationDto,
  ): Promise<void> {
    await this.authService.resendEmailVerification(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/api-key')
  @ApiOperation({
    summary: 'Create or Update API Key',
    description: "Endpoint to create or update the user's API key.",
  })
  @ApiResponse({
    status: 201,
    description: 'API key created or updated successfully',
    type: ApiKeyDto,
  })
  public async createOrUpdateAPIKey(
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyDto> {
    try {
      const apiKey = await this.authService.createOrUpdateAPIKey(req.user);
      return { apiKey };
    } catch (e) {
      this.logger.log(
        e.message,
        `${AuthJwtController.name} - ${ErrorAuth.ApiKeyCouldNotBeCreatedOrUpdated}`,
      );
      throw new ControlledError(
        ErrorAuth.ApiKeyCouldNotBeCreatedOrUpdated,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
