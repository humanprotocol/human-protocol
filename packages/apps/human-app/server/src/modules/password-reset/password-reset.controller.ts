import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ForgotPasswordCommand,
  ForgotPasswordDto,
} from './model/forgot-password.model';
import {
  RestorePasswordCommand,
  RestorePasswordDto,
} from './model/restore-password.model';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Password-Reset')
@Controller('/password-reset')
export class PasswordResetController {
  constructor(
    private readonly service: PasswordResetService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Endpoint to initiate the password reset process',
  })
  public async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const forgotPasswordCommand = this.mapper.map(
      forgotPasswordDto,
      ForgotPasswordDto,
      ForgotPasswordCommand,
    );
    return await this.service.processForgotPassword(forgotPasswordCommand);
  }

  @Post('/restore-password')
  @ApiOperation({
    summary: 'Endpoint to restore the user password after reset',
  })
  public async restorePassword(@Body() dto: RestorePasswordDto): Promise<void> {
    const command = this.mapper.map(
      dto,
      RestorePasswordDto,
      RestorePasswordCommand,
    );
    return await this.service.processRestorePassword(command);
  }
}
