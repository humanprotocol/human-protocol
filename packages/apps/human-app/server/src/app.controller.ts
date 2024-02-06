import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
  @UsePipes(new ValidationPipe())
  public signupWorker(@Body() signupWorkerDto: SignupWorkerDto): Promise<void> {
    return this.authWorkerService.signupWorker(signupWorkerDto);
  }
}
