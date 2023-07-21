import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { IJwt } from '../../common/interfaces/auth';
import { UserCreateDto } from '../user/user.dto';
import {
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { RequestWithUser } from 'src/common/types';
import { JwtAuthGuard } from 'src/common/guards';

@Public()
@ApiTags('Auth')
@Controller('/auth')
export class AuthJwtController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @UseInterceptors(ClassSerializerInterceptor)
  public async signup(@Body() data: UserCreateDto): Promise<IJwt> {
    const userEntity = await this.authService.signup(data);
    return await this.authService.auth(userEntity);
  }

  @Post('/signin')
  @HttpCode(200)
  public signin(@Body() data: SignInDto): Promise<IJwt> {
    return this.authService.signin(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/refresh')
  @HttpCode(200)
  async refreshToken(@Req() request: RequestWithUser): Promise<IJwt> {
    return this.authService.auth(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(204)
  public async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.authService.logout(request.user);
  }

  @Post('/forgot-password')
  @HttpCode(204)
  public forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(data);
  }

  @Post('/restore-password')
  @HttpCode(204)
  public restorePassword(@Body() data: RestorePasswordDto): Promise<boolean> {
    return this.authService.restorePassword(data);
  }

  @Post('/email-verification')
  @HttpCode(200)
  public emailVerification(@Body() data: VerifyEmailDto): Promise<IJwt> {
    return this.authService.emailVerification(data);
  }

  @Post('/resend-email-verification')
  @HttpCode(204)
  public resendEmailVerification(
    @Body() data: ResendEmailVerificationDto,
  ): Promise<void> {
    return this.authService.resendEmailVerification(data);
  }
}
