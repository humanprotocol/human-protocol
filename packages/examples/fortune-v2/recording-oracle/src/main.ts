import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "body-parser";
import { useContainer } from "class-validator";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const configService: ConfigService = app.get(ConfigService);

  const baseUrl = configService.get<string>("FE_URL", "http://localhost:3001");

  app.enableCors({
    origin:
      process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging"
        ? [`http://localhost:3001`, `http://127.0.0.1:3001`, `http://0.0.0.0:3001`, baseUrl]
        : [baseUrl],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  const sessionSecret = configService.get<string>("SESSION_SECRET", "");

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(json({ limit: "5mb" }));
  app.use(urlencoded({ limit: "5mb", extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("Fortune Recording Oracle API")
    .setDescription("Swagger Fortune Recording Oracle API")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  const host = configService.get<string>("HOST", "localhost");
  const port = configService.get<string>("PORT", "5001");

  app.use(helmet());

  await app.listen(port, host, async () => {
    // eslint-disable-next-line no-console
    console.info(`Recording oracle server is running on http://${host}:${port}`);
  });
}

bootstrap();
