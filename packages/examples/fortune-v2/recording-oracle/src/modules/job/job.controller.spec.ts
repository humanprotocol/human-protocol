import { JobController } from "./job.controller";
import { JobService } from "./job.service";

jest.mock("./job.service", () => {
  return {
    JobService: jest.fn().mockImplementation(() => {
      return { processJobSolution: jest.fn() };
    }),
  };
});

describe("JobController", () => {
  let jobController: JobController;
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
