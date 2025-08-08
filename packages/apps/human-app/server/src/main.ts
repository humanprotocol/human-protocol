import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import { AppModule } from './app.module';
import { EnvironmentConfigService } from './common/config/environment-config.service';
import logger, { nestLoggerOverride } from './logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: nestLoggerOverride,
  });

  const configService: ConfigService = app.get(ConfigService);
  const envConfigService = new EnvironmentConfigService(configService);
  if (envConfigService.isCorsEnabled) {
    app.enableCors({
      origin: envConfigService.corsEnabledOrigin,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
      allowedHeaders: envConfigService.corsAllowedHeaders,
    });
  }
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Human APP API')
    .setDescription('Swagger Human APP API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const host = envConfigService.host;
  const port = envConfigService.port;
  if (envConfigService.isCacheToRestart) {
    const cacheManager: Cache = app.get<Cache>(CACHE_MANAGER);
    await cacheManager.reset();
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(port, host, async () => {
    logger.info(`Human APP server is running on http://${host}:${port}`);
  });
}
bootstrap();
