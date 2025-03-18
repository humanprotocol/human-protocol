import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  @Get('/')
  @Public()
  @Redirect('/swagger', 301)
  @ApiExcludeEndpoint()
  public swagger(): string {
    return 'OK';
  }
}
