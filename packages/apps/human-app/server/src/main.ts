import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EnvironmentConfigService } from './common/config/environment-config.service';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService: ConfigService = app.get(ConfigService);
  const envConfigService = new EnvironmentConfigService(configService);

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

  await app.listen(port, host, async () => {
    logger.log(`Human APP server is running on http://${host}:${port}`);
  });
}
bootstrap();
