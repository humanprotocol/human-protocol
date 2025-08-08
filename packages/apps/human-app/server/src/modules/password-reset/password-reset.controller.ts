import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
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
@Public()
@Controller('/password-reset')
export class PasswordResetController {
  constructor(
    private readonly service: PasswordResetService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({
    summary: 'Endpoint to initiate the password reset process',
  })
  @HttpCode(200)
  @Post('/forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const forgotPasswordCommand = this.mapper.map(
      forgotPasswordDto,
      ForgotPasswordDto,
      ForgotPasswordCommand,
    );
    return await this.service.processForgotPassword(forgotPasswordCommand);
  }

  @ApiOperation({
    summary: 'Endpoint to restore the user password after reset',
  })
  @HttpCode(200)
  @Post('/restore-password')
  async restorePassword(@Body() dto: RestorePasswordDto): Promise<void> {
    const command = this.mapper.map(
      dto,
      RestorePasswordDto,
      RestorePasswordCommand,
    );
    return await this.service.processRestorePassword(command);
  }
}
