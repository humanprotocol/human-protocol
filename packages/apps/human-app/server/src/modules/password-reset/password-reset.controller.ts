import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ForgotPasswordCommand,
  ForgotPasswordDto,
} from './model/forgot-password.model';
import {
  RestorePasswordCommand,
  RestorePasswordDto,
} from './model/restore-password.model';

@Controller('/password-reset')
export class PasswordResetController {
  constructor(
    private readonly service: PasswordResetService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Password-Reset')
  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Endpoint to initiate the password reset process',
  })
  @UsePipes(new ValidationPipe())
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

  @ApiTags('Password-Reset')
  @Post('/restore-password')
  @ApiOperation({
    summary: 'Endpoint to restore the user password after reset',
  })
  @UsePipes(new ValidationPipe())
  public async restorePassword(@Body() dto: RestorePasswordDto): Promise<void> {
    const command = this.mapper.map(
      dto,
      RestorePasswordDto,
      RestorePasswordCommand,
    );
    return await this.service.processRestorePassword(command);
  }
}
