import {
  Body,
  Controller,
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
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ReportAbuseDto } from './abuse.dto';
import { AbuseService } from './abuse.service';
import { SlackAuthGuard } from 'src/common/guards/slack.auth';

@ApiTags('Abuse')
@Controller('/abuse')
export class AbuseController {
  constructor(private readonly abuseService: AbuseService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
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
    await this.abuseService.createAbuse(data, request.user.id);
    return;
  }

  @ApiBearerAuth()
  @UseGuards(SlackAuthGuard)
  @Post('/slack')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive slack interactions',
    description: 'Endpoint to receive slack interactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Interaction successfully received',
  })
  async receiveSlackInteraction(@Body() data: any): Promise<string> {
    return this.abuseService.receiveSlackInteraction(JSON.parse(data.payload));
  }
}
