import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';

import { ServerConfigService } from './common/config/server-config.service';
import logger, { nestLoggerOverride } from './logger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
    logger: nestLoggerOverride,
  });

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Fortune Exchange Oracle API')
    .setDescription('Swagger Fortune Exchange Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(port, host, async () => {
    logger.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
