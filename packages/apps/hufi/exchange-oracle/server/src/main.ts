import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';

import { AppModule } from './app.module';
import { ConfigNames } from './common/config';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });

  const configService: ConfigService = app.get(ConfigService);

  const host = configService.get<string>(ConfigNames.HOST)!;
  const port = configService.get<string>(ConfigNames.PORT)!;

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'staging'
        ? [
            `http://localhost:${port}`,
            `http://127.0.0.1:${port}`,
            `http://0.0.0.0:${port}`,
            `http://${host}:${port}`,
          ]
        : [`http://${host}:${port}`],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Hufi Exchange Oracle API')
    .setDescription('Swagger Hufi Exchange Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
