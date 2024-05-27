import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import setupE2eEnvironment from './env-setup';
import { ChainId } from '@human-protocol/sdk';
import { NetworkConfigService } from '../../src/common/config/network-config.service';
import { Web3ConfigService } from '../../src/common/config/web3-config.service';
import {
  MOCK_PRIVATE_KEY,
  MOCK_WEB3_NODE_HOST,
  MOCK_WEB3_RPC_URL,
} from '../../test/constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    setupE2eEnvironment();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NetworkConfigService)
      .useValue({
        networks: [
          {
            chainId: ChainId.LOCALHOST,
            rpcUrl: MOCK_WEB3_RPC_URL,
          },
        ],
      })
      .overrideProvider(Web3ConfigService)
      .useValue({
        privateKey: MOCK_PRIVATE_KEY,
        env: MOCK_WEB3_NODE_HOST,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(301)
      .expect('Moved Permanently. Redirecting to /swagger');
  });
});
