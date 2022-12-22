import session from "express-session";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "body-parser";
import { useContainer } from "class-validator";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

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

  app.use(helmet());

  app.use(
    session({
      secret: configService.get<string>("SESSION_SECRET", "auth"),
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(json({ limit: "5mb" }));
  app.use(urlencoded({ limit: "5mb", extended: true }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("Job Launcher API")
    .setDescription("Swagger Job Launcher API")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  const host = configService.get<string>("HOST", "localhost");
  const port = configService.get<string>("PORT", "3000");

  await app.listen(port, host, () => {
    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();
