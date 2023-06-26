import { ConfigModule, registerAs } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { networkMap } from "@/common/constants";
import { Web3Service } from "./web3.service";

describe("Web3Service", () => {
  let web3Service: Web3Service;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs("ethereum", () => ({
            privateKey: "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
          })),
        ),
      ],
      providers: [Web3Service],
    }).compile();

    web3Service = module.get<Web3Service>(Web3Service);
  });

  describe("getSigner", () => {
    it("should return the signer for the specified chainId", async () => {
      for (const networkKey of Object.keys(networkMap)) {
        // Iterate through the networkMap to test each chainId
        const network = networkMap[networkKey];

        const signer = web3Service.getSigner(network.chainId);
        expect(signer).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((signer.provider as any).connection.url).toBe(network.rpcUrl);
      }
    });

    it("should return undefined if chainId is not configured", () => {
      const chainId = 1;

      const signer = web3Service.getSigner(chainId);

      expect(signer).toBeUndefined();
    });
  });
});
