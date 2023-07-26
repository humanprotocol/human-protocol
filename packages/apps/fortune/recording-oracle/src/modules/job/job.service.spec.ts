import { ConfigModule, registerAs } from "@nestjs/config";
import { EscrowClient, EscrowStatus, StorageClient } from "@human-protocol/sdk";
import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { of } from "rxjs";

import { JobService } from "./job.service";
import { Web3Service } from "../web3/web3.service";
import { JobRequestType } from "./job.dto";
import { ErrorJob } from "@/common/constants/errors";

const OPERATOR_ADDRESS = "TEST_OPERATOR_ADDRESS";

const SOLUTION = {
  escrowAddress: "0x0000000000000000000000000000000000000000",
  chainId: 1,
  exchangeAddress: "EXCHANGE_ADDRESS",
  workerAddress: "WORKER_ADDRESS",
  solution: "Good",
};

jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  ethers: {
    providers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getNetwork: jest.fn().mockResolvedValue({
          chainId: 1338,
        }),
      })),
    },
    Wallet: jest.fn().mockImplementation(() => ({
      getAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
    })),
    utils: {
      getAddress: jest.fn().mockImplementation((addr: string) => addr),
    },
  },
}));

jest.mock("@human-protocol/sdk", () => ({
  ...jest.requireActual("@human-protocol/sdk"),
  EscrowClient: {
    build: jest.fn(),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest.fn().mockResolvedValue([{ url: "UPLOADED_URL", hash: "UPLOADED_HASH" }]),
  })),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

const signerMock = {
  address: OPERATOR_ADDRESS,
  getAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
};

const httpServicePostMock = jest.fn().mockReturnValue(of({ status: 200, data: {} }));

describe("JobController", () => {
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
  });

  describe("processJobSolution", () => {
    it("should throw an error if the recording oracle address is invalid", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue("RECORDING_ORACLE_ADDRESS"),
      }));

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(
        ErrorJob.AddressMismatches,
      );
    });

    it("should throw an error if the escrow is not in pending status", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
      }));

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(ErrorJob.InvalidStatus);
    });

    it("should throw an error if the manifest is missing required data", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue({});

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(ErrorJob.InvalidManifest);
    });

    it("should throw an error if the manifest contains an invalid job type", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { submissionsRequired: 2, requestType: "InvalidJobType" };
        }

        return [SOLUTION];
      });

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(ErrorJob.InvalidJobType,);
    });

    it("should record new solution", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { submissionsRequired: 2, requestType: JobRequestType.FORTUNE };
        }

        return [];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("Solution is recorded.");
    });

    it("should revert if solution already exists", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { submissionsRequired: 2, requestType: JobRequestType.FORTUNE };
        }

        return [SOLUTION];
      });

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(ErrorJob.SolutionAlreadyExists);
    });

    it("should call reputation oracle url when all solutions are submitted.", async () => {
      const chainId = 1;
      const escrowAddress = "0x0000000000000000000000000000000000000000";
      const oldSolution = {
        exchangeAddress: escrowAddress,
        workerAddress: "WORKER_ADDRESS",
        solution: "Old",
      };
      const newSolution = { exchangeAddress: "EXCHANGE_ADDRESS", workerAddress: "WORKER_ADDRESS", solution: "Good" };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { submissionsRequired: 2, requestType: JobRequestType.FORTUNE };
        }

        return [oldSolution];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("The requested job is completed.");
      expect(httpServicePostMock).toHaveBeenCalledWith("REPUTATION_ORACLE_URL/webhook", { chainId, escrowAddress });
    });
  });
});
