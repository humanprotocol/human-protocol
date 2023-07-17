import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Manifest } from '../../common/interfaces/manifest';
import { GetManifestQueryDto } from './manifest.dto';
import { ManifestService } from './manifest.service';

@Public()
@ApiTags('Manifest')
@Controller('manifest')
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @Get()
  public async getManifest(
    @Query() query: GetManifestQueryDto,
  ): Promise<Manifest> {
    const { chainId, escrowAddress } = query;
    return await this.manifestService.getManifest(chainId, escrowAddress);
  }
}
