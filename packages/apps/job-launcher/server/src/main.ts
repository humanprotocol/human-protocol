import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { ServerConfigService } from './common/config/server-config.service';
import init from './app-init';
import { ILeader, ILeadersFilter, OperatorUtils } from '@human-protocol/sdk';
import { ChainId } from '@human-protocol/sdk';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    cors: true,
  });
  await init(app);

  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  const host = serverConfigService.host;
  const port = serverConfigService.port;

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);
  });

  const filter: ILeadersFilter = {
    networks: [ChainId.POLYGON], // Example chain IDs
    // Add other filter properties if necessary
  };

  // Call the getLeaders method
  const leaders: ILeader[] = await OperatorUtils.getLeaders(filter);

  // Process the leaders data
  console.log(leaders);
}

void bootstrap();
