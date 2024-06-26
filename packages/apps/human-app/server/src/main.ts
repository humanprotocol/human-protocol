import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EnvironmentConfigService } from './common/config/environment-config.service';
import { GlobalExceptionsFilter } from './common/filter/global-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService: ConfigService = app.get(ConfigService);
  const envConfigService = new EnvironmentConfigService(configService);
<<<<<<< HEAD
  app.enableCors({
    origin: ['http://localhost', 'http://localhost:5173'], // TODO: do rework
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  });
=======
  if (envConfigService.isCorsEnabled) {
    app.enableCors({
      origin: envConfigService.corsEnabledOrigin,
      allowedHeaders: envConfigService.corsAllowedHeaders,
    });
  }
>>>>>>> 583e66435c12c7261845de7abbcee9e54ac4551c
  const config = new DocumentBuilder()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .setTitle('Human APP API')
    .setDescription('Swagger Human APP API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const host = envConfigService.host;
  const port = envConfigService.port;

  app.useGlobalFilters(new GlobalExceptionsFilter());

  await app.listen(port, host, async () => {
    logger.log(`Human APP server is running on http://${host}:${port}`);
  });
}
bootstrap();
