import axios from "axios";
import { EscrowStatus, StorageClient } from "@human-protocol/sdk";
import { JobService } from "./job.service";

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
    getResultsUrl: jest.fn(),
    storeResults: jest.fn(),
  })),
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest.fn().mockResolvedValue([{ url: "UPLOADED_URL", hash: "UPLOADED_HASH" }]),
  })),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

describe("JobController", () => {
  let jobService: JobService;

  beforeEach(() => {
    jobService = new JobService(
      {
        jsonRpcUrl: "http://localhost:8545",
        privateKey: "TEST_PRIVATE_KEY",
      },
      {
        accessKey: "TEST_ACCESS_KEY",
        secretKey: "TEST_SECRET_KEY",
        endPoint: "localhost",
        port: 9000,
        useSSL: false,
        bucket: "TEST_BUCKET",
      },
    );
  });

  describe("processJobSolution", () => {
    it("should throw an error if the recording oracle address is invalid", async () => {
      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue("RECORDING_ORACLE_ADDRESS");

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(
        "Escrow Recording Oracle address mismatches the current one",
      );
    });

    it("should throw an error if the escrow is not in pending status", async () => {
      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue(OPERATOR_ADDRESS);
      jest.spyOn(jobService.escrowClient, "getStatus").mockResolvedValue(EscrowStatus.Launched);

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError("Escrow is not in the Pending status");
    });

    it("should throw an error if the manifest is missing required data", async () => {
      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue(OPERATOR_ADDRESS);
      jest.spyOn(jobService.escrowClient, "getStatus").mockResolvedValue(EscrowStatus.Pending);
      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue({});

      expect(jobService.processJobSolution(SOLUTION)).rejects.toThrowError(
        "Manifest does not contain the required data",
      );
    });

    it("should record new solution", async () => {
      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue(OPERATOR_ADDRESS);
      jest.spyOn(jobService.escrowClient, "getStatus").mockResolvedValue(EscrowStatus.Pending);
      jest.spyOn(jobService.escrowClient, "getManifestUrl").mockResolvedValue("MANIFEST_URL");
      jest.spyOn(jobService.escrowClient, "getResultsUrl").mockResolvedValue("RESULTS_URL");
      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2, reputationOracleUrl: "REPUTATION_ORACLE_URL" };
        }

        return [];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("Solution is recorded.");
      expect(jobService.escrowClient.storeResults).toBeCalledWith(
        SOLUTION.escrowAddress,
        "UPLOADED_URL",
        "UPLOADED_HASH",
      );
    });

    it("should revert if solution already exists", async () => {
      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue(OPERATOR_ADDRESS);
      jest.spyOn(jobService.escrowClient, "getStatus").mockResolvedValue(EscrowStatus.Pending);
      jest.spyOn(jobService.escrowClient, "getManifestUrl").mockResolvedValue("MANIFEST_URL");
      jest.spyOn(jobService.escrowClient, "getResultsUrl").mockResolvedValue("RESULTS_URL");
      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2, reputationOracleUrl: "REPUTATION_ORACLE_URL" };
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

      jest.spyOn(jobService.escrowClient, "getRecordingOracleAddress").mockResolvedValue(OPERATOR_ADDRESS);
      jest.spyOn(jobService.escrowClient, "getStatus").mockResolvedValue(EscrowStatus.Pending);
      jest.spyOn(jobService.escrowClient, "getManifestUrl").mockResolvedValue("MANIFEST_URL");
      jest.spyOn(jobService.escrowClient, "getResultsUrl").mockResolvedValue("RESULTS_URL");
      StorageClient.downloadFileFromUrl = jest.fn().mockImplementation(async url => {
        if (url === "MANIFEST_URL") {
          return { fortunesRequired: 2, reputationOracleUrl: "REPUTATION_ORACLE_URL" };
        }

        return [oldSolution];
      });

      expect(await jobService.processJobSolution(SOLUTION)).toBe("The requested job is completed.");
      expect(jobService.escrowClient.storeResults).toBeCalledWith(
        SOLUTION.escrowAddress,
        "UPLOADED_URL",
        "UPLOADED_HASH",
      );
      expect(axios.post).toHaveBeenCalledWith("REPUTATION_ORACLE_URL/send-fortunes", [oldSolution, newSolution]);
    });
  });
});
