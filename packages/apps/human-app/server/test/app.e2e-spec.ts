import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import nock from "nock";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WorkerType } from "../src/interfaces/signup-worker-request.dto";
import {describe} from '@jest/globals';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('should process the singnup worker request', async () => {
    const registeredType =  WorkerType.WORKER.toString();
      nock(configService.get<string>('REPUTATION_ORACLE_URL') || 'http://localhost:5678')
        .post('/auth/signup', {
          email: 'john_doe@example.com',
          password: 'v3ry57r0n9P455w0r[)!',
          type: registeredType,
        }, {
          reqheaders: {
            'Content-Type': 'application/json',
          },
        })
        .reply(200, );

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'john_doe@example.com',
          password: 'v3ry57r0n9P455w0r[)!'
        })
        .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
