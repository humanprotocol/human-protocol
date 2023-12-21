/* eslint-disable no-console */
import { ethers } from 'hardhat';

export class DeploymentUtils {
  magistrateAddress: string;
  hubChainId: number;
  targetSecondsPerBlock: number;
  hubAutomaticRelayerAddress: string;
  deployerPrivateKey: string;
  deployerAddress: string;

  constructor() {
    this.magistrateAddress = process.env.MAGISTRATE_ADDRESS || '';
    this.hubChainId = parseInt(process.env.HUB_WORMHOLE_CHAIN_ID || '0');
    this.targetSecondsPerBlock = parseInt(
      process.env.HUB_SECONDS_PER_BLOCK || '0'
    );
    this.hubAutomaticRelayerAddress =
      process.env.HUB_AUTOMATIC_RELAYER_ADDRESS || '';
    this.deployerPrivateKey = process.env.PRIVATE_KEY || '';
    this.deployerAddress = new ethers.Wallet(this.deployerPrivateKey).address;
  }

  async getProposalExecutionData() {
    const hmTokenAddress = process.env.HM_TOKEN_ADDRESS || '';
    const description = process.env.DESCRIPTION || '';

    const IERC20 = await ethers.getContractAt('IERC20', hmTokenAddress);

    const encodedCall = IERC20.interface.encodeFunctionData('transfer', [
      this.deployerAddress,
      50,
    ]);

    const targets = [hmTokenAddress];
    const values = [0];
    const calldatas = [encodedCall];

    return { targets, values, calldatas, description };
  }
}

async function main() {
  const utils = new DeploymentUtils();

  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  console.log('Targets:', targets);
  console.log('Values:', values);
  console.log('Calldatas:', calldatas);
  console.log('Description:', description);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
