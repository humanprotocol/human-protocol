import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { of } from "rxjs";

import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { Web3Service } from "../web3/web3.service";
import { MOCK_ADDRESS, MOCK_FILE_HASH, MOCK_FILE_KEY, MOCK_FILE_URL, MOCK_HOST, MOCK_PORT, MOCK_REPUTATION_ORACLE_WEBHOOK_URL, MOCK_WEB3_PRIVATE_KEY } from "../../../test/constants";
import { ChainId } from "@human-protocol/sdk";
import { JobRequestType } from "@/common/enums/job";

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: jest.fn().mockImplementation(() => ({})),
}));

const signerMock = {
  address: MOCK_ADDRESS,
  getAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
};

const httpServicePostMock = jest.fn().mockReturnValue(of({ status: 200, data: {} }));

describe("JobController", () => {
  let jobController: JobController;
  let jobService: JobService;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'REPUTATION_ORACLE_WEBHOOK_URL':
            return MOCK_REPUTATION_ORACLE_WEBHOOK_URL;
          case 'HOST':
            return MOCK_HOST;
          case 'PORT':
            return MOCK_PORT;
          case 'WEB3_PRIVATE_KEY':
            return MOCK_WEB3_PRIVATE_KEY;
          default: 
            return null;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: httpServicePostMock,
          },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobController = new JobController(jobService);
  });

  describe.only("solve", () => {
    it("should call service", async () => {
      jest.spyOn(jobService, "processJobSolution").mockImplementation(async () => "OK");

      expect(
        await jobController.solve({
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: "Solution",
        }),
      ).toBe("OK");
    });
  });
});
