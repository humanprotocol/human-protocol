import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { EnvironmentConfigService } from './common/config/env-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'debug', 'error', 'verbose', 'warn']
        : ['log', 'error', 'warn'],
  });

  const configService: ConfigService = app.get(ConfigService);

  const envConfigService = new EnvironmentConfigService(configService);

  if (envConfigService.isCorsEnabled) {
    app.enableCors({
      origin: envConfigService.corsEnabledOrigin,
      allowedHeaders: envConfigService.corsAllowedHeaders,
    });
  }
  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription('Swagger Dashboar API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const host = envConfigService.host;
  const port = envConfigService.port;

  await app.listen(port, host, async () => {
    console.info(`Dashboard server is running on http://${host}:${port}`);
  });
}
bootstrap();
