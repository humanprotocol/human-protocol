import { Controller, Get, HttpCode } from '@nestjs/common';
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
  @Get('/proposals')
  public async getProposals(): Promise<ProposalResponse[]> {
    return this.governanceService.getProposals();
  }
}
