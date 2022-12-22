import { Body, ClassSerializerInterceptor, Controller, HttpCode, Ip, Post, UseInterceptors } from "@nestjs/common";

import { UserCreateDto } from "../user/dto";
import { AuthService } from "./auth.service";
import {
  ForgotPasswordDto,
  SignInDto,
  LogoutDto,
  RefreshDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  VerifyEmailDto,
} from "./dto";
import { Public } from "../common/decorators";
import { IJwt } from "../common/jwt";
import { ApiTags } from "@nestjs/swagger";

@Public()
@ApiTags("Auth")
@Controller("/auth")
export class AuthJwtController {
  constructor(private readonly authService: AuthService) {}

  @Post("/signup")
  @UseInterceptors(ClassSerializerInterceptor)
  public async signup(@Body() data: UserCreateDto, @Ip() ip: string): Promise<IJwt> {
    const userEntity = await this.authService.signup(data);
    return this.authService.auth(userEntity, ip);
  }

  @Post("/signin")
  @HttpCode(200)
  public signin(@Body() data: SignInDto, @Ip() ip: string): Promise<IJwt> {
    return this.authService.signin(data, ip);
  }

  @Post("/logout")
  @HttpCode(204)
  public async logout(@Body() data: LogoutDto): Promise<void> {
    await this.authService.logout(data);
  }

  @Post("/refresh")
  @HttpCode(200)
  async refreshToken(@Body() data: RefreshDto, @Ip() ip: string): Promise<IJwt> {
    return this.authService.refresh(data, ip);
  }

  @Post("/forgot-password")
  @HttpCode(204)
  public forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(data);
  }

  @Post("/restore-password")
  @HttpCode(204)
  public restorePassword(@Body() data: RestorePasswordDto): Promise<void> {
    return this.authService.restorePassword(data);
  }

  @Post("/email-verification")
  @HttpCode(200)
  public emailVerification(@Body() data: VerifyEmailDto, @Ip() ip: string): Promise<IJwt> {
    return this.authService.emailVerification(data, ip);
  }

  @Post("/resend-email-verification")
  @HttpCode(204)
  public resendEmailVerification(@Body() data: ResendEmailVerificationDto): Promise<void> {
    return this.authService.resendEmailVerification(data);
  }
}
