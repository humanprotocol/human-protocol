import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { Public } from '../../common/decorators';
import { UiConfigResponseDto } from './ui-configuration.dto';

@Controller()
@Public()
@ApiTags('UI-Configuration')
export class UiConfigurationController {
  constructor(
    private readonly environmentConfigService: EnvironmentConfigService,
  ) {}

  @ApiOperation({ summary: 'Retrieve UI configuration' })
  @ApiOkResponse({
    type: UiConfigResponseDto,
    description: 'UI Configuration object',
  })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('/ui-config')
  public async getConfig(): Promise<UiConfigResponseDto> {
    return {
      chainIdsEnabled: this.environmentConfigService.chainIdsEnabled,
    };
  }
}
