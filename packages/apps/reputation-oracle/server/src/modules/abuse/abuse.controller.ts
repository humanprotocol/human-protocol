import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../../common/decorators';
import type { RequestWithUser } from '../../common/types';

import {
  AbuseResponseDto,
  ReportAbuseDto,
  SlackInteractionDto,
} from './abuse.dto';
import { AbuseService } from './abuse.service';
import { AbuseRepository } from './abuse.repository';
import { AbuseSlackAuthGuard } from './abuse-slack-auth.guard';

@ApiTags('Abuse')
@Controller('/abuse')
export class AbuseController {
  constructor(
    private readonly abuseService: AbuseService,
    private readonly abuseRepository: AbuseRepository,
  ) {}

  @ApiBearerAuth()
  @Post('/report')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Report abuse',
    description: 'Endpoint to report an identified abuse.',
  })
  @ApiBody({ type: ReportAbuseDto })
  @ApiResponse({
    status: 200,
    description: 'Report successfully received',
  })
  async reportAbuse(
    @Req() request: RequestWithUser,
    @Body() data: ReportAbuseDto,
  ): Promise<void> {
    await this.abuseService.reportAbuse({
      escrowAddress: data.escrowAddress,
      chainId: data.chainId,
      userId: request.user.id,
      reason: data.reason,
    });
  }

  @ApiBearerAuth()
  @Get('/reports')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get all abuse reports by user',
    description:
      'Endpoint to retrieve all abuse entities created by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of abuse entities created by the user',
  })
  async getUserAbuseReports(
    @Req() request: RequestWithUser,
  ): Promise<AbuseResponseDto[]> {
    const abuseEntities = await this.abuseRepository.findByUserId(
      request.user.id,
    );
    return abuseEntities.map((abuseEntity) => {
      return {
        id: abuseEntity.id,
        escrowAddress: abuseEntity.escrowAddress,
        chainId: abuseEntity.chainId,
        status: abuseEntity.status,
        reason: abuseEntity.reason,
      };
    });
  }

  @Public()
  @UseGuards(AbuseSlackAuthGuard)
  @Post('/slack-interactions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive slack interactions',
    description: 'Endpoint to receive slack interactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Interaction successfully received',
  })
  @HttpCode(200)
  async receiveInteractions(
    @Body() data: SlackInteractionDto,
  ): Promise<string> {
    return this.abuseService.processSlackInteraction(JSON.parse(data.payload));
  }
}
