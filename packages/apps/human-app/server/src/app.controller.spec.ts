import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthWorkerService } from "./modules/auth-worker/auth-worker.service";
import { authWorkerServiceMock } from "./modules/auth-worker/auth-worker.service.mock";

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AuthWorkerService],
    })
    .overrideProvider(AuthWorkerService)
    .useValue(authWorkerServiceMock)
    .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('swagger', () => {
    it('should return "OK"', () => {
      expect(appController.swagger()).toBe('OK');
    });
  });
});
