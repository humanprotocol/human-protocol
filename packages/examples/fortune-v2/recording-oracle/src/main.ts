import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "body-parser";
import { useContainer } from "class-validator";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";

import { GlobalExceptionsFilter } from "@/common/filter";

import { AppModule } from "./app.module";
import { ServerConfigType, serverConfigKey } from "./common/config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const { feUrl, sessionSecret, host, port }: ServerConfigType = app.get(serverConfigKey);

  // Modules
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Filters
  app.useGlobalFilters(new GlobalExceptionsFilter());

  // Middlewares
  app.enableCors({
    origin:
      process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging"
        ? [`http://localhost:3001`, `http://127.0.0.1:3001`, `http://0.0.0.0:3001`, feUrl]
        : [feUrl],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  });
  app.use(cookieParser());
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(json({ limit: "5mb" }));
  app.use(urlencoded({ limit: "5mb", extended: true }));
  app.use(helmet());

  // Swagger
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("Fortune Recording Oracle API")
    .setDescription("Swagger Fortune Recording Oracle API")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  await app.listen(port, host, async () => {
    // eslint-disable-next-line no-console
    console.info(`Recording oracle server is running on http://${host}:${port}`);
  });
}

bootstrap();
