import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import helmet from 'helmet';

import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { ServerConfigType, serverConfigKey } from './common/config';
import { GlobalExceptionsFilter } from './common/filter';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });

  const { sessionSecret, host, port }: ServerConfigType =
    app.get(serverConfigKey);

  app.useGlobalFilters(new GlobalExceptionsFilter());

  app.enableCors({
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
      },
    }),
  );
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Fortune Recording Oracle API')
    .setDescription('Swagger Fortune Recording Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
