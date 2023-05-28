import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";

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
      envFilePath: `.env.${process.env.NODE_ENV as string}`,
    }),
    JobModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
