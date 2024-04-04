import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from './common/decorators';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';

@Controller('/')
@ApiExcludeController()
@ApiTags('Main')
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  public redirect(): void {}
}
