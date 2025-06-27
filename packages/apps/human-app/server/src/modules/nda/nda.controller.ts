import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { GetNDACommand, SignNDACommand, SignNDADto } from './model/nda.model';
import { NDAService } from './nda.service';

@Controller('/nda')
@ApiTags('NDA')
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
  async getLatestNDA(@Request() req: RequestWithUser) {
    const command = new GetNDACommand();
    command.token = req.token;
    return this.ndaService.getLatestNDA(command);
  }

  @ApiOperation({
    summary: 'Sign NDA',
    description:
      'Signs the NDA with the provided URL. The URL must match the latest NDA URL.',
  })
  @HttpCode(200)
  @Post('sign')
  async signNDA(@Body() dto: SignNDADto, @Request() req: RequestWithUser) {
    const command = this.mapper.map(dto, SignNDADto, SignNDACommand);
    command.token = req.token;
    await this.ndaService.signNDA(command);
    return { message: 'NDA signed successfully' };
  }
}
