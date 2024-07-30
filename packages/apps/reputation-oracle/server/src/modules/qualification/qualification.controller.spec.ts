import { Test, TestingModule } from '@nestjs/testing';
import { QualificationController } from './qualification.controller';
import { QualificationService } from './qualification.service';
import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
  QualificationDto,
} from './qualification.dto';

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
        expiresAt: new Date(),
      };
      const result: QualificationDto = {
        reference: 'test-ref',
        title: 'Test Title',
        description: 'Test Description',
        expiresAt: new Date(createQualificationDto.expiresAt!),
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
          expiresAt: new Date(),
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
      const assignQualificationDto: AssignQualificationDto = {
        reference: 'test-ref',
        workerAddresses: ['0x123'],
        workerEmails: ['test@example.com'],
      };

      jest.spyOn(qualificationService, 'assign').mockResolvedValue();

      await qualificationController.assign(assignQualificationDto);
      expect(qualificationService.assign).toHaveBeenCalledWith(
        assignQualificationDto,
      );
    });
  });

  describe('unassign', () => {
    it('should unassign a qualification from users', async () => {
      const unassignQualificationDto: UnassignQualificationDto = {
        reference: 'test-ref',
        workerAddresses: ['0x123'],
        workerEmails: ['test@example.com'],
      };

      jest.spyOn(qualificationService, 'unassign').mockResolvedValue();

      await qualificationController.unassign(unassignQualificationDto);
      expect(qualificationService.unassign).toHaveBeenCalledWith(
        unassignQualificationDto,
      );
    });
  });

  describe('delete', () => {
    it('should delete a qualification', async () => {
      const reference = 'test-ref';

      jest.spyOn(qualificationService, 'delete').mockResolvedValue();

      await qualificationController.delete(reference);
      expect(qualificationService.delete).toHaveBeenCalledWith(reference);
    });
  });
});
