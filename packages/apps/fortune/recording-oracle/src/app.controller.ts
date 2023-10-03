import { Controller, Get, Redirect } from '@nestjs/common';

import { Public } from '@/common/decorators';

@Controller('/')
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  public health(): string {
    return 'OK';
  }
}
