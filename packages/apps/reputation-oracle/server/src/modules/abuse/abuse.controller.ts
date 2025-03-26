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
import { AbuseResponseDto, ReportAbuseDto } from './abuse.dto';
import { AbuseService } from './abuse.service';
import { SlackAuthGuard } from '../../common/guards/slack.auth';
import { RequestWithUser } from '../../common/interfaces/request';
import { Public } from '../../common/decorators';

@ApiTags('Abuse')
@Controller('/abuse')
export class AbuseController {
  constructor(private readonly abuseService: AbuseService) {}

  @ApiBearerAuth()
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
  @Get('/user')
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
    return this.abuseService.getAbuseReportsByUser(request.user.id);
  }

  @Public()
  @UseGuards(SlackAuthGuard)
  @Post('/interactions')
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
  async receiveInteractions(@Body() data: any): Promise<string> {
    return this.abuseService.receiveInteractions(JSON.parse(data.payload));
  }
}
