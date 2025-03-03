import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import { GetNDACommand, SignNDACommand, SignNDADto } from './model/nda.model';
import { NDAService } from './nda.service';

@Controller('/nda')
@ApiTags('NDA')
@UsePipes(new ValidationPipe())
@ApiBearerAuth()
export class NDAController {
  @InjectMapper() private readonly mapper: Mapper;

  constructor(
    private readonly ndaService: NDAService,
    @InjectMapper() mapper: Mapper,
  ) {
    this.mapper = mapper;
  }

  @ApiOperation({
    summary: 'Retrieves latest NDA URL',
    description:
      'Retrieves the latest NDA URL that users must sign to join the oracle',
  })
  @Get('/')
  async getLatestNDA(@Authorization() token: string) {
    const command = new GetNDACommand();
    command.token = token;
    return this.ndaService.getLatestNDA(command);
  }

  @ApiOperation({
    summary: 'Sign NDA',
    description:
      'Signs the NDA with the provided URL. The URL must match the latest NDA URL.',
  })
  @Post('sign')
  async signNDA(@Body() dto: SignNDADto, @Authorization() token: string) {
    const command = this.mapper.map(dto, SignNDADto, SignNDACommand);
    command.token = token;
    await this.ndaService.signNDA(command);
    return { message: 'NDA signed successfully' };
  }
}
