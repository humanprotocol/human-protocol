import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Corrected path
import {
  MetaHumanGovernor,
  VHMToken,
  CrossChainGovernorCountingSimple,
  TimelockController,
} from '../typechain-types';

async function main() {
  const utils = new DeploymentUtils();

  const chainId = parseInt(process.env.HUB_WORMHOLE_CHAIN_ID || '0');
  const vHMTAddress = process.env.HUB_VOTE_TOKEN_ADDRESS || '';
  if (!vHMTAddress) {
    throw new Error('HUB_VOTE_TOKEN_ADDRESS environment variable is not set.');
  }

  const VHMTokenFactory = await ethers.getContractFactory('VHMToken');
  const voteToken = VHMTokenFactory.attach(vHMTAddress) as VHMToken;

  const proposers = [ethers.constants.AddressZero];
  const executors = [ethers.constants.AddressZero];

  const TimelockControllerFactory = await ethers.getContractFactory(
    'TimelockController'
  );
  const timelockController = (await TimelockControllerFactory.deploy(
    1,
    proposers,
    executors,
    utils.deployerAddress
  )) as TimelockController;

  const spokeContracts: CrossChainGovernorCountingSimple.CrossChainAddressStruct[] =
    [];

  const MetaHumanGovernorFactory = await ethers.getContractFactory(
    'MetaHumanGovernor'
  );
  const governanceContract = (await MetaHumanGovernorFactory.deploy(
    voteToken.address,
    timelockController.address,
    spokeContracts,
    chainId,
    utils.hubAutomaticRelayerAddress,
    utils.magistrateAddress,
    12
  )) as MetaHumanGovernor;

  const PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
  const TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');
  await timelockController.grantRole(PROPOSER_ROLE, governanceContract.address);
  await timelockController.revokeRole(
    TIMELOCK_ADMIN_ROLE,
    utils.deployerAddress
  );

  console.log('MetaHumanGovernor deployed to:', governanceContract.address);
  console.log('TimelockController deployed to:', timelockController.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
