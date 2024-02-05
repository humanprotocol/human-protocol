import { Body, Controller, Get, Post, Redirect, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupDto } from './interfaces/signup-worker-request.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Redirect('/swagger', 301)
  @ApiExcludeEndpoint()
  public swagger(): string {
    return 'OK';
  }

  @ApiTags('Auth')
  @Post('/auth/signup')
  @ApiOperation({ summary: 'Worker registration' })
  @UsePipes(new ValidationPipe())
  public signup(@Req() req: Request, @Res() res: Response, @Body() signupDto: SignupDto): Promise<void> {
    req.body.type = 'WORKER';
    return this.appService.proxy(req, res);
  }
}
