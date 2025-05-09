import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from '../job/job.module';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { ContentModerationRequestRepository } from './content-moderation-request.repository';
import { GCVContentModerationService } from './gcv-content-moderation.service';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { ManifestModule } from '../manifest/manifest.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ContentModerationRequestEntity, JobEntity]),
    ConfigModule,
    JobModule,
    ManifestModule,
  ],
  providers: [
    ContentModerationRequestRepository,
    JobRepository,
    GCVContentModerationService,
  ],
  exports: [GCVContentModerationService],
})
export class ContentModerationModule {}
