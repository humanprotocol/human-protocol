import { Test, TestingModule } from '@nestjs/testing';
import { QualificationController } from './qualification.controller';
import { QualificationService } from './qualification.service';
import { CreateQualificationDto, QualificationDto } from './qualification.dto';

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
            createQualification: jest.fn(),
            getQualifications: jest.fn(),
            assign: jest.fn(),
            unassign: jest.fn(),
            delete: jest.fn(),
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

  describe('create', () => {
    it('should create a qualification', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'test-ref',
        title: 'Test Title',
        description: 'Test Description',
        expiresAt: new Date().toISOString(),
      };
      const result: QualificationDto = {
        reference: 'test-ref',
        title: 'Test Title',
        description: 'Test Description',
        expiresAt: createQualificationDto.expiresAt,
      };

      jest
        .spyOn(qualificationService, 'createQualification')
        .mockResolvedValue(result);

      expect(await qualificationController.create(createQualificationDto)).toBe(
        result,
      );
      expect(qualificationService.createQualification).toHaveBeenCalledWith(
        createQualificationDto,
      );
    });

    it('should create a qualification without expiresAt', async () => {
      const createQualificationDto: CreateQualificationDto = {
        reference: 'test-ref',
        title: 'Test Title',
        description: 'Test Description',
      };
      const result: QualificationDto = {
        reference: 'test-ref',
        title: 'Test Title',
        description: 'Test Description',
      };

      jest
        .spyOn(qualificationService, 'createQualification')
        .mockResolvedValue(result);

      expect(await qualificationController.create(createQualificationDto)).toBe(
        result,
      );
      expect(qualificationService.createQualification).toHaveBeenCalledWith(
        createQualificationDto,
      );
    });
  });

  describe('getQualifications', () => {
    it('should return an array of qualifications', async () => {
      const result: QualificationDto[] = [
        {
          reference: 'test-ref',
          title: 'Test Title',
          description: 'Test Description',
          expiresAt: new Date().toISOString(),
        },
      ];

      jest
        .spyOn(qualificationService, 'getQualifications')
        .mockResolvedValue(result);

      expect(await qualificationController.getQualifications()).toBe(result);
      expect(qualificationService.getQualifications).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('should assign a qualification to users', async () => {
      const reference = 'test-ref';
      const workerAddresses = ['0x123'];

      jest.spyOn(qualificationService, 'assign').mockResolvedValue();

      await qualificationController.assign(reference, { workerAddresses });
      expect(qualificationService.assign).toHaveBeenCalledWith(
        reference,
        workerAddresses,
      );
    });
  });

  describe('unassign', () => {
    it('should unassign a qualification from users', async () => {
      const reference = 'test-ref';
      const workerAddresses = ['0x123'];

      jest.spyOn(qualificationService, 'unassign').mockResolvedValue();

      await qualificationController.unassign(reference, { workerAddresses });
      expect(qualificationService.unassign).toHaveBeenCalledWith(
        reference,
        workerAddresses,
      );
    });
  });

  describe('delete', () => {
    it('should delete a qualification', async () => {
      const reference = 'test-ref';

      jest.spyOn(qualificationService, 'delete').mockResolvedValue();

      await qualificationController.deleteQualification(reference);
      expect(qualificationService.delete).toHaveBeenCalledWith(reference);
    });
  });
});
