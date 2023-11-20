import session from 'express-session';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ConfigNames } from './common/config';
import { Encryption, EncryptionUtils } from '@human-protocol/sdk';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });

  const configService: ConfigService = app.get(ConfigService);

  const baseUrl = configService.get<string>(
    ConfigNames.FE_URL,
    'http://localhost:3005',
  );

  // app.enableCors({
  //   origin:
  //     process.env.NODE_ENV === 'development' ||
  //     process.env.NODE_ENV === 'staging'
  //       ? [
  //           `http://localhost:3001`,
  //           `http://127.0.0.1:3001`,
  //           `http://0.0.0.0:3001`,
  //           baseUrl,
  //         ]
  //       : [baseUrl],
  //   credentials: true,
  //   exposedHeaders: ['Content-Disposition'],
  // });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  const sessionSecret = configService.get<string>(
    ConfigNames.SESSION_SECRET,
    'session-secret',
  );

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Job Launcher API')
    .setDescription('Swagger Job Launcher API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const host = configService.get<string>(ConfigNames.HOST, 'localhost');
  const port = +configService.get<string>(ConfigNames.PORT, '5000');


  console.log(configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!)
  let encryption = await Encryption.build(configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!)
  let res = await encryption.decrypt(configService.get<string>(ConfigNames.S3_USE_SSL)!)
  console.log(res);


  app.use(helmet());
  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
