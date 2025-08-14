import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import { ActiveProposalResponse } from './model/governance.model';

@ApiTags('Governance')
@Controller()
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('/governance/active-proposals')
  @ApiOperation({ summary: 'Get active governance proposals' })
  @ApiOkResponse({ type: ActiveProposalResponse, isArray: true })
  public async getActiveProposals(): Promise<ActiveProposalResponse[]> {
    return this.governanceService.getActiveProposals();
  }
}
