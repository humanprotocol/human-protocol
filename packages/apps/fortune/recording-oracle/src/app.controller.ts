import { Controller, Get, Redirect } from '@nestjs/common';

import { Public } from './common/decorators';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

@Controller('/')
@ApiExcludeController()
@ApiTags('Main')
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  public redirect(): void {
    return;
  }
}
