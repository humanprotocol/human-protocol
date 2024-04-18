import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

export default async function init(app: any) {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService: ConfigService = app.get(ConfigService);

  app.use(cookieParser());

  const sessionSecret = configService.get<string>('SESSION_SECRET', '');

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
    .setTitle('Reputation Oracle API')
    .setDescription('Swagger Reputation Oracle API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());
}
