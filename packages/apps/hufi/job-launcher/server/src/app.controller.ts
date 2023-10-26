import { Controller, Get, Redirect } from '@nestjs/common';

import { Public } from './common/decorators';
import { ApiTags } from '@nestjs/swagger';

@Controller('/')
@ApiTags('Main')
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  public redirect(): void {}
}
