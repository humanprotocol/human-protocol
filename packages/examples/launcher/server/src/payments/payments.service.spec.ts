import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let paymentService: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService],
    }).compile();

    paymentService = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(paymentService).toBeDefined();
  });
});
