import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { ConfigNames } from './common/config';
import init from './app-init';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });
  await init(app);

  const configService: ConfigService = app.get(ConfigService);

  const host = configService.get<string>(ConfigNames.HOST, 'localhost');
  const port = +configService.get<string>(ConfigNames.PORT, '5000');
  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
