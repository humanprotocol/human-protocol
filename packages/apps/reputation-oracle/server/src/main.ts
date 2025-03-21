import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import { ServerConfigService } from './config/server-config.service';
import logger, { nestLoggerOverride } from './logger';
import { getBodyParserOptions } from '@nestjs/platform-express/adapters/utils/get-body-parser-options.util';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
    logger: nestLoggerOverride,
    bodyParser: false,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(json(getBodyParserOptions(true, { limit: '5mb' })));
  app.use(
    urlencoded(getBodyParserOptions(true, { limit: '5mb', extended: true })),
  );

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Reputation Oracle API')
    .setDescription('Swagger Reputation Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  await app.listen(port, host, async () => {
    logger.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
