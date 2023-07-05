import { ConfigModule, registerAs } from "@nestjs/config";
import { EscrowClient, EscrowStatus, StorageClient } from "@human-protocol/sdk";
import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { of } from "rxjs";

import { JobService } from "./job.service";
import { Web3Service } from "../web3/web3.service";

const OPERATOR_ADDRESS = "TEST_OPERATOR_ADDRESS";

const SOLUTION = {
  escrowAddress: "ESCROW_ADDRESS",
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
  EscrowClient: jest.fn().mockImplementation(() => ({
    getRecordingOracleAddress: jest.fn(),
    getStatus: jest.fn(),
    getManifestUrl: jest.fn(),
    getIntermediateResultsUrl: jest.fn(),
    storeResults: jest.fn(),
  })),
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
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue("RECORDING_ORACLE_ADDRESS"),
      }));

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(
        "Escrow Recording Oracle address mismatches the current one",
      );
    });

    it("should throw an error if the escrow is not in pending status", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
      }));

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError("Escrow is not in the Pending status");
    });

    it("should throw an error if the manifest is missing required data", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue({});

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(
        "Manifest does not contain the required data",
      );
    });

    it("should record new solution", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2 };
        }

        return [];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("Solution is recorded.");
    });

    it("should revert if solution already exists", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2 };
        }

        return [SOLUTION];
      });

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError("Solution already exists");
    });

    it("should call reputation oracle url when all solutions are submitted.", async () => {
      const oldSolution = {
        exchangeAddress: "EXCHANGE_ADDRESS",
        workerAddress: "WORKER_ADDRESS",
        solution: "Old",
      };
      const newSolution = { exchangeAddress: "EXCHANGE_ADDRESS", workerAddress: "WORKER_ADDRESS", solution: "Good" };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest.fn().mockResolvedValue("MANIFEST_URL"),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue("RESULTS_URL"),
        storeResults: jest.fn(),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2 };
        }

        return [oldSolution];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("The requested job is completed.");
      expect(httpServicePostMock).toHaveBeenCalledWith("REPUTATION_ORACLE_URL/send-fortunes", [
        oldSolution,
        newSolution,
      ]);
    });
  });
});
