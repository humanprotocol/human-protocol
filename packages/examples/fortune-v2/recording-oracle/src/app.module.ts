import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";

import configuration from "@/common/config/configuration";
import { HttpValidationPipe } from "@/common/pipes";
import { JobModule } from "@/modules/job/job.module";

import { AppController } from "./app.controller";

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    JobModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
