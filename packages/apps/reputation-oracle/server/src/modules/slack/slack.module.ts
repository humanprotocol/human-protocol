import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}
