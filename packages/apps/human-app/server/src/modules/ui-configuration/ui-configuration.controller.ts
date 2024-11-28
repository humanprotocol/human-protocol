import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { UiConfigResponseDto } from './ui-configuration.dto';

@Controller()
@ApiTags('UI-Configuration')
export class UiConfigurationController {
  constructor(
    private readonly environmentConfigService: EnvironmentConfigService,
  ) {}
  @Get('/ui-config')
  @ApiOperation({ summary: 'Retrieve UI configuration' })
  @ApiOkResponse({
    type: UiConfigResponseDto,
    description: 'UI Configuration object',
  })
  public async getConfig(): Promise<UiConfigResponseDto> {
    return {
      chainIdsEnabled: this.environmentConfigService.chainIdsEnabled,
    };
  }
}
