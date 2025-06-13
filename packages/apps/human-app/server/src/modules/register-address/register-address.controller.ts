import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/interfaces/jwt';
import {
  RegisterAddressCommand,
  RegisterAddressDto,
  RegisterAddressResponse,
} from './model/register-address.model';
import { RegisterAddressService } from './register-address.service';

@ApiTags('Register Address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/user/register-address')
export class RegisterAddressController {
  @InjectMapper() private readonly mapper: Mapper;

  constructor(
    private readonly service: RegisterAddressService,
    @InjectMapper() mapper: Mapper,
  ) {
    this.mapper = mapper;
  }

  @Post('/')
  @ApiOperation({
    summary: 'Register Blockchain Address',
  })
  public async registerAddress(
    @Body() dto: RegisterAddressDto,
    @Request() req: RequestWithUser,
  ): Promise<RegisterAddressResponse> {
    const command = this.mapper.map(
      dto,
      RegisterAddressDto,
      RegisterAddressCommand,
    );
    command.token = req.token;
    return this.service.registerBlockchainAddress(command);
  }
}
