import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { EnvironmentConfigService } from './common/config/environment-config.service';
import { GlobalExceptionsFilter } from './common/filter/global-exceptions.filter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import Logger, { nestLoggerOverride } from '@human-protocol/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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
  app.useGlobalFilters(new GlobalExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(port, host, async () => {
    Logger.info(`Human APP server is running on http://${host}:${port}`);
  });
}
bootstrap();
