import session from "express-session";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "body-parser";
import { useContainer } from "class-validator";
import helmet from "helmet";

import { AppModule } from "./app.module";
import {  getSignedData, sign, verify } from "./common/helpers";

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
    .setTitle("Fortune Exchange Oracle API")
    .setDescription("Swagger Fortune Exchange Oracle API")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  const host = configService.get<string>("HOST", "localhost");
  const port = configService.get<string>("PORT", "5000");

  // app.use(helmet());

  await app.listen(port, host, async () => {
    //const keyPair = await generateKeyPair()

    const keyPair_1 = {
      mnemonic: configService.get<string>("MNEMONIC", "MNEMONIC"),
      privateKey: configService.get<string>("PGP_PRIVATE_KEY", "PGP_PRIVATE_KEY"),
      publicKey: configService.get<string>("PGP_PUBLIC_KEY", "PGP_PUBLIC_KEY"),
    }

    const keyPair_2 = {
      mnemonic: configService.get<string>("MNEMONIC_2", "MNEMONIC"),
      privateKey: configService.get<string>("PGP_PRIVATE_KEY_2", "PGP_PRIVATE_KEY"),
      publicKey: configService.get<string>("PGP_PUBLIC_KEY_2", "PGP_PUBLIC_KEY"),
    }

    const keyPair_3 = {
      mnemonic: configService.get<string>("MNEMONIC_3", "MNEMONIC"),
      privateKey: configService.get<string>("PGP_PRIVATE_KEY_3", "PGP_PRIVATE_KEY"),
      publicKey: configService.get<string>("PGP_PUBLIC_KEY_3", "PGP_PUBLIC_KEY"),
    }

    const payload = {
      escrowAddress: "0x0000000000000000000000000000000000000000",
      chainId: 80001
    }
    const signatureData = {
      mnemonic: configService.get<string>("MNEMONIC", "MNEMONIC"),
      privateKey: configService.get<string>("PGP_PRIVATE_KEY", "PGP_PRIVATE_KEY"),
      publicKey: configService.get<string>("PGP_PUBLIC_KEY", "PGP_PUBLIC_KEY"),
      message: JSON.stringify(payload)
    }

    
    console.log(1111)
    const signedMessage = await sign(signatureData)
    console.log(signedMessage)
    console.log(22222)
    const signedObj = await getSignedData(signedMessage)
    console.log(signedObj)
    console.log(33333)

    signatureData.message = signedMessage
    console.log(await verify(signatureData))


    console.info(`API server is running on http://${host}:${port}`);
  });
}

void bootstrap();

