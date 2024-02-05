import { Test, TestingModule } from '@nestjs/testing';
import { AuthWorkerService } from './auth-worker.service';

describe('AuthWorkerService', () => {
  let service: AuthWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthWorkerService],
    }).compile();

    service = module.get<AuthWorkerService>(AuthWorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
