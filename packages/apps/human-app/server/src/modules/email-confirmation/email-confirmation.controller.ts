import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  EmailVerificationCommand,
  EmailVerificationDto,
} from './model/email-verification.model';
import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationDto,
} from './model/resend-email-verification.model';
import { Authorization } from '../../common/config/params-decorators';

@Controller()
export class EmailConfirmationController {
  constructor(
    private readonly service: EmailConfirmationService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Email-Confirmation')
  @Post('/email-confirmation/email-verification')
  @ApiOperation({
    summary: 'Endpoint to verify the user email address',
  })
  @UsePipes(new ValidationPipe())
  public async verifyEmail(
    @Body() emailVerificationDto: EmailVerificationDto,
  ): Promise<void> {
    const emailVerificationCommand = this.mapper.map(
      emailVerificationDto,
      EmailVerificationDto,
      EmailVerificationCommand,
    );
    return this.service.processEmailVerification(emailVerificationCommand);
  }

  @ApiTags('Email-Confirmation')
  @Post('/email-confirmation/resend-email-verification')
  @ApiOperation({
    summary: 'Endpoint to resend the email verification link',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async resendEmailVerification(
    @Body() resendEmailVerificationDto: ResendEmailVerificationDto,
    @Authorization() token: string,
  ): Promise<void> {
    const resendEmailVerificationCommand = this.mapper.map(
      resendEmailVerificationDto,
      ResendEmailVerificationDto,
      ResendEmailVerificationCommand,
    );
    resendEmailVerificationCommand.token = token;
    return this.service.processResendEmailVerification(
      resendEmailVerificationCommand,
    );
  }
}
