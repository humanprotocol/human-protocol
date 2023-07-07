import { ConfigModule, registerAs } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { of } from "rxjs";

import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { Web3Service } from "../web3/web3.service";

const OPERATOR_ADDRESS = "TEST_OPERATOR_ADDRESS";

const signerMock = {
  address: OPERATOR_ADDRESS,
  getAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
};

const httpServicePostMock = jest.fn().mockReturnValue(of({ status: 200, data: {} }));

describe("JobController", () => {
  let jobController: JobController;
  let jobService: JobService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs("storage", () => ({
            accessKey: "TEST_ACCESS_KEY",
            secretKey: "TEST_SECRET_KEY",
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
            bucket: "TEST_BUCKET",
          })),
        ),
        ConfigModule.forFeature(
          registerAs("server", () => ({
            reputationOracleURL: "REPUTATION_ORACLE_URL",
          })),
        ),
      ],
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
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobController = new JobController(jobService);
  });

  describe("Solve", () => {
    it("should call service", async () => {
      jest.spyOn(jobService, "processJobSolution").mockImplementation(async () => "OK");

      expect(
        await jobController.solve({
          escrowAddress: "ESCROW_ADDRESS",
          chainId: 1,
          exchangeAddress: "EXCHANGE_ADDRESS",
          workerAddress: "WORKER_ADDRESS",
          solution: "Good",
        }),
      ).toBe("OK");
    });
  });
});
