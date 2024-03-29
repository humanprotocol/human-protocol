import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import init from './app-init';
import { CommonConfigService } from './common/config/common-config.service';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });
  await init(app);

  const configService: ConfigService = app.get(ConfigService);
  const commonConfigService = new CommonConfigService(configService);

  const host = commonConfigService.host;
  const port = commonConfigService.port;

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
