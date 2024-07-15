import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvironmentConfigService } from './common/config/environment-config.service';
import { GlobalExceptionsFilter } from './common/filter/global-exceptions.filter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService: ConfigService = app.get(ConfigService);
  const envConfigService = new EnvironmentConfigService(configService);
  if (envConfigService.isCorsEnabled) {
    app.enableCors({
      origin: envConfigService.corsEnabledOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
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
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(port, host, async () => {
    logger.log(`Human APP server is running on http://${host}:${port}`);
  });
}
bootstrap();
