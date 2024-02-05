import { Body, Controller, Get, Post, Redirect, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupWorkerDto } from './interfaces/signup-worker-request.dto';
import { AuthWorkerService } from './modules/auth-worker/auth-worker.service';

@Controller()
export class AppController {
  constructor(private readonly authWorkerService: AuthWorkerService) {}

  @Get('/')
  @Redirect('/swagger', 301)
  @ApiExcludeEndpoint()
  public swagger(): string {
    return 'OK';
  }

  @ApiTags('Auth')
  @Post('/auth/signup')
  @ApiOperation({ summary: 'Worker registration' })
  @UsePipes(new ValidationPipe()) // validation pipe for request body
  public signupWorker(
    @Req() req: Request,
    @Res() res: Response,
    @Body() signupWorkerDto: SignupWorkerDto
  ): Promise<void> {
    req.body.type = 'WORKER';
    return this.authWorkerService.signupWorker(req, res);
  }
}
