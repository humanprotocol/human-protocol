import { WorkerController } from '../worker.controller';
import { WorkerService } from '../worker.service';
import { Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerDto,
} from '../interfaces/worker-registration.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { UserType } from '../../../common/enums/user';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { WorkerProfile } from '../worker.mapper';
import { workerServiceMock } from './worker.service.mock';

describe('WorkerController', () => {
  let controller: WorkerController;
  let workerService: WorkerService;
  let mapper: Mapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [WorkerService, WorkerProfile],
    })
      .overrideProvider(WorkerService)
      .useValue(workerServiceMock)
      .compile();

    controller = module.get<WorkerController>(WorkerController);
    workerService = module.get<WorkerService>(WorkerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should worker service signup method with proper fields set', async () => {
      const dto: SignupWorkerDto = {
        email: 'email@example.com',
        password: 'Pa55word!',
      };
      await controller.signupWorker(dto);
      const expectedCommand = {
        email: dto.email,
        password: dto.password,
        type: UserType.WORKER,
      } as SignupWorkerCommand;
      expect(workerService.signupWorker).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
