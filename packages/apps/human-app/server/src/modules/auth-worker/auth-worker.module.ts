import { Module } from '@nestjs/common';
import { AuthWorkerService } from './auth-worker.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AuthWorkerService],
  exports: [AuthWorkerService]
})
export class AuthWorkerModule {}
