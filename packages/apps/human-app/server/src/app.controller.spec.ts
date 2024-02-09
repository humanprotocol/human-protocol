import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { WorkerService } from './modules/worker/worker.service';
import { workerServiceMock } from './modules/worker/spec/worker.service.mock';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [WorkerService],
    })
      .overrideProvider(WorkerService)
      .useValue(workerServiceMock)
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('swagger', () => {
    it('should return "OK"', () => {
      expect(appController.swagger()).toBe('OK');
    });
  });
});
