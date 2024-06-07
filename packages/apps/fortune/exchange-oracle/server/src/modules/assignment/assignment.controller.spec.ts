import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { RequestWithUser } from '../../common/types/jwt';
import {
  GetAssignmentsDto,
  CreateAssignmentDto,
  ResignDto,
} from './assignment.dto';
import { AssignmentStatus, JobType } from '../../common/enums/job';
import { MOCK_EXCHANGE_ORACLE } from '../../../test/constants';

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
        jobType: JobType.FORTUNE,
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
          headers: { referer: MOCK_EXCHANGE_ORACLE },
        } as any,
        query,
      );
      expect(result).toBe(expectedResult);
      expect(assignmentService.getAssignmentList).toHaveBeenCalledWith(
        query,
        userAddress,
        reputationNetwork,
        expect.any(String),
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

  describe('resignJob', () => {
    it('should call jobService.resignJob', async () => {
      const assignmentId = 123;
      const resignJobDto: ResignDto = {
        assignmentId,
      };

      jest.spyOn(assignmentService, 'resign').mockResolvedValue();

      await assignmentController.resign(
        { user: { address: userAddress } } as RequestWithUser,
        resignJobDto,
      );

      expect(assignmentService.resign).toHaveBeenCalledWith(
        resignJobDto.assignmentId,
        userAddress,
      );
    });
  });
});
