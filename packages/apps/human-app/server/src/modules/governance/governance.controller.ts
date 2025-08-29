import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import { ProposalResponse } from './model/governance.model';

@ApiTags('Governance')
@ApiBearerAuth()
@Controller('/governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @ApiOperation({ summary: 'Get pending and active governance proposals' })
  @ApiOkResponse({ type: ProposalResponse, isArray: true })
  @HttpCode(200)
  @Header('Cache-Control', 'private, max-age=300')
  @Get('/proposals')
  public async getProposals(): Promise<ProposalResponse[]> {
    return this.governanceService.getProposals();
  }
}
