import { Controller, Get, Redirect } from '@nestjs/common';

import { Public } from './common/decorators';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('/')
@ApiExcludeController()
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  public health(): string {
    return 'OK';
  }
}
