import { Test, TestingModule } from '@nestjs/testing';
import { QualificationController } from './qualification.controller';
import { QualificationService } from './qualification.service';
import { QualificationDto } from './qualification.dto';
import { ChainId } from '@human-protocol/sdk';

describe('QualificationController', () => {
  let qualificationController: QualificationController;
  let qualificationService: QualificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualificationController],
      providers: [
        {
          provide: QualificationService,
          useValue: {
            getQualifications: jest.fn(),
          },
        },
      ],
    }).compile();

    qualificationController = module.get<QualificationController>(
      QualificationController,
    );
    qualificationService =
      module.get<QualificationService>(QualificationService);
  });

  describe('getQualifications', () => {
    it('should return an array of qualifications', async () => {
      const result: QualificationDto[] = [
        {
          reference: 'test-ref',
          title: 'Test Title',
          description: 'Test Description',
          expiresAt: new Date(),
        },
      ];

      jest
        .spyOn(qualificationService, 'getQualifications')
        .mockResolvedValue(result);

      expect(
        await qualificationController.getQualifications(ChainId.LOCALHOST),
      ).toBe(result);
      expect(qualificationService.getQualifications).toHaveBeenCalled();
    });
  });
});
