import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { RequestWithUser } from '../../common/types/jwt';
import { GetAssignmentsDto, CreateAssignmentDto } from './assignment.dto';
import { JOB_TYPE } from '../../common/constant';
import { AssignmentStatus } from '../../common/enums/job';

jest.mock('../../common/utils/signature');

describe('assignmentController', () => {
  let assignmentController: AssignmentController;
  let assignmentService: AssignmentService;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const userAddress = '0x1234567890123456789012345678901234567891';
  const reputationNetwork = '0x1234567890123456789012345678901234567892';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [AssignmentController],
      providers: [
        {
          provide: AssignmentService,
          useValue: createMock<AssignmentService>(),
        },
      ],
    }).compile();

    assignmentController =
      moduleRef.get<AssignmentController>(AssignmentController);
    assignmentService = moduleRef.get<AssignmentService>(AssignmentService);
  });

  describe('processWebhook', () => {
    it('should call assignmentService.getAssignmentList', async () => {
      const query: GetAssignmentsDto = {
        chainId: 80001,
        jobType: JOB_TYPE,
        escrowAddress: escrowAddress,
        status: AssignmentStatus.ACTIVE,
        skip: 1,
      };
      const expectedResult = {
        page: 0,
        pageSize: 0,
        totalPages: 0,
        totalResults: 0,
        results: [],
      };
      jest
        .spyOn(assignmentService, 'getAssignmentList')
        .mockResolvedValue(expectedResult);

      const result = await assignmentController.getAssignments(
        {
          user: { address: userAddress, reputationNetwork: reputationNetwork },
        } as RequestWithUser,
        query,
      );
      expect(result).toBe(expectedResult);
      expect(assignmentService.getAssignmentList).toHaveBeenCalledWith(
        query,
        userAddress,
        reputationNetwork,
      );
    });

    it('should call assignmentService.createAssignment', async () => {
      const body: CreateAssignmentDto = {
        chainId: 80001,
        escrowAddress: escrowAddress,
      };
      jest.spyOn(assignmentService, 'createAssignment').mockResolvedValue();
      await assignmentController.createAssignment(
        {
          user: { address: userAddress },
        } as RequestWithUser,
        body,
      );
      expect(assignmentService.createAssignment).toHaveBeenCalledWith(body, {
        address: userAddress,
      });
    });
  });
});
