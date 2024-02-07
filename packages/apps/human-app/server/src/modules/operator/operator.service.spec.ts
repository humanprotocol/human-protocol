import { Test, TestingModule } from '@nestjs/testing';
import { OperatorService } from './operator.service';

describe('OperatorService', () => {
  let service: OperatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperatorService],
    }).compile();

    service = module.get<OperatorService>(OperatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
