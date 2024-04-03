import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ServerConfigService } from './common/config/server-config.service';

export default async function init(app: any) {
  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  app.use(
    session({
      secret: serverConfigService.sessionSecret,
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

  app.use(helmet());
}
