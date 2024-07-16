import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import { RegisterAddressService } from './register-address.service';
import {
  RegisterAddressCommand,
  RegisterAddressDto,
  RegisterAddressResponse,
} from './model/register-address.model';
import { Mapper } from '@automapper/core';

@Controller('/user/register-address')
export class RegisterAddressController {
  @InjectMapper() private readonly mapper: Mapper;

  constructor(
    private readonly service: RegisterAddressService,
    @InjectMapper() mapper: Mapper,
  ) {
    this.mapper = mapper;
  }

  @ApiTags('Register Address')
  @Post('/')
  @ApiOperation({
    summary: 'Register Blockchain Address',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async registerAddress(
    @Body() dto: RegisterAddressDto,
    @Authorization() token: string,
  ): Promise<RegisterAddressResponse> {
    const command = this.mapper.map(
      dto,
      RegisterAddressDto,
      RegisterAddressCommand,
    );
    command.token = token;
    return this.service.registerBlockchainAddress(command);
  }
}
