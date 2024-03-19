import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../src/app.module';
import init from '../src/app-init';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);
let nestAppInitialized = false;

async function bootstrapNestApp() {
  if (!nestAppInitialized) {
    const app = await NestFactory.create(AppModule, adapter);
    await init(app); // Initialize additional settings
    await app.init();
    nestAppInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  await bootstrapNestApp(); // Ensure NestJS app is bootstrapped

  return expressApp(req, res);
}
