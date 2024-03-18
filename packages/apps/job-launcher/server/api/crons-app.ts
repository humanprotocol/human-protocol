import { NestFactory } from '@nestjs/core';
import { CronsAppModule } from './crons-app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

async function bootstrap() {
  const app = await NestFactory.create(CronsAppModule, adapter);
  await app.init();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await bootstrap(); // Ensure NestJS app is bootstrapped

  return expressApp(req, res);
}
