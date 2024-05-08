import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getBodyParserOptions } from '@nestjs/platform-express/adapters/utils/get-body-parser-options.util';
import { json, urlencoded } from 'express';
import init from './app-init';
import { AppModule } from './app.module';
import { ServerConfigService } from './common/config/server-config.service';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
    bodyParser: false,
  });

  app.use(json(getBodyParserOptions(true, { limit: '50mb' })));
  app.use(urlencoded(getBodyParserOptions(true, { limit: '50mb' })));

  await init(app);

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
