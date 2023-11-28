import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  Request,
  UnprocessableEntityException,
  Logger,

} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { UserCreateDto } from '../user/user.dto';
import {
  AuthDto,
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ErrorAuth } from '../../common/constants/errors';

@ApiTags('Auth')
@Controller('/auth')
export class AuthJwtController {
  private readonly logger = new Logger(AuthJwtController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/signup')
  @UseInterceptors(ClassSerializerInterceptor)
  public async signup(@Body() data: UserCreateDto): Promise<void> {
    await this.authService.signup(data);
    return;
  }

  @Public()
  @Post('/signin')
  @HttpCode(200)
  public signin(@Body() data: SignInDto): Promise<AuthDto> {
    return this.authService.signin(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/refresh')
  @HttpCode(200)
  async refreshToken(@Req() request: RequestWithUser): Promise<AuthDto> {
    return this.authService.auth(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(204)
  public async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.authService.logout(request.user);
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(204)
  public forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(data);
  }

  @Public()
  @Post('/restore-password')
  @HttpCode(204)
  public restorePassword(@Body() data: RestorePasswordDto): Promise<boolean> {
    return this.authService.restorePassword(data);
  }

  @Public()
  @Post('/email-verification')
  @HttpCode(200)
  public async emailVerification(@Body() data: VerifyEmailDto): Promise<void> {
    await this.authService.emailVerification(data);
  }

  @Public()
  @Post('/resend-email-verification')
  @HttpCode(204)
  public resendEmailVerification(
    @Body() data: ResendEmailVerificationDto,
  ): Promise<void> {
    return this.authService.resendEmailVerification(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/api-key')
  @HttpCode(HttpStatus.CREATED)
  public async createOrUpdateAPIKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    try {
      const apiKey = await this.authService.createOrUpdateAPIKey(req.user.id);
      return { apiKey };
    } catch (e) {
      this.logger.log(
        e.message,
        `${AuthJwtController.name} - ${ErrorAuth.ApiKeyCouldNotBeCreatedOrUpdated}`,
      );
      throw new UnprocessableEntityException(
        ErrorAuth.ApiKeyCouldNotBeCreatedOrUpdated,
      );
    }
  }
}
