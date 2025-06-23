import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { EmailConfirmationService } from './email-confirmation.service';
import {
  EmailVerificationCommand,
  EmailVerificationDto,
} from './model/email-verification.model';
import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationDto,
} from './model/resend-email-verification.model';

@ApiTags('Email-Confirmation')
@Controller('/email-confirmation')
export class EmailConfirmationController {
  constructor(
    private readonly service: EmailConfirmationService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({
    summary: 'Endpoint to verify the user email address',
  })
  @Public()
  @Post('/email-verification')
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

  @Post('/resend-email-verification')
  @ApiOperation({
    summary: 'Endpoint to resend the email verification link',
  })
  @ApiBearerAuth()
  public async resendEmailVerification(
    @Body() resendEmailVerificationDto: ResendEmailVerificationDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const resendEmailVerificationCommand = this.mapper.map(
      resendEmailVerificationDto,
      ResendEmailVerificationDto,
      ResendEmailVerificationCommand,
    );
    resendEmailVerificationCommand.token = req.token;
    return this.service.processResendEmailVerification(
      resendEmailVerificationCommand,
    );
  }
}
