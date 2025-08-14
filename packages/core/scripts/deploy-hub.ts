/* eslint-disable no-console */
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  // HMTDeployment
  // const HMToken = await ethers.getContractFactory(
  //   'contracts/HMToken.sol:HMToken'
  // );
  // const HMTokenContract = await HMToken.deploy(
  //   1000000000,
  //   'HUMAN Token',
  //   18,
  //   'HMT'
  // );
  // await HMTokenContract.waitForDeployment();
  // console.log('HMToken Address: ', await HMTokenContract.getAddress());
  const hmtTokenAddress = process.env.HMT_TOKEN_ADDRESS || '';
  if (!hmtTokenAddress) {
    throw new Error('HMT Token Address is missing');
  }

  // vHMT Deployment
  // const VHMToken = await ethers.getContractFactory(
  //   'contracts/governance/vhm-token/VHMToken.sol:VHMToken'
  // );
  // const VHMTokenContract = await VHMToken.deploy(hmtTokenAddress);
  // await VHMTokenContract.waitForDeployment();
  // console.log('VHMToken deployed to:', await VHMTokenContract.getAddress());
  const vhmTokenAddress = process.env.VHM_TOKEN_ADDRESS || '';
  if (!vhmTokenAddress) {
    throw new Error('VHM Token Address is missing');
  }

  //DeployHUB
  const chainId = process.env.HUB_WORMHOLE_CHAIN_ID;
  const hubAutomaticRelayerAddress =
    process.env.HUB_AUTOMATIC_RELAYER_ADDRESS ?? '';
  const magistrateAddress = process.env.MAGISTRATE_ADDRESS ?? '';
  const hubSecondsPerBlock = process.env.HUB_SECONDS_PER_BLOCK
    ? parseInt(process.env.HUB_SECONDS_PER_BLOCK)
    : 0;
  const votingDelay = process.env.VOTING_DELAY
    ? parseInt(process.env.VOTING_DELAY)
    : 0;
  const votingPeriod = process.env.VOTING_PERIOD
    ? parseInt(process.env.VOTING_PERIOD)
    : 0;
  const proposalThreshold = process.env.PROPOSAL_THRESHOLD
    ? parseInt(process.env.PROPOSAL_THRESHOLD)
    : 0;
  const quorumFraction = process.env.QUORUM_FRACTION
    ? parseInt(process.env.QUORUM_FRACTION)
    : 0;
  const TimelockController =
    await ethers.getContractFactory('TimelockController');
  const TimelockControllerContract = await TimelockController.deploy(
    1,
    [],
    [],
    await deployer.getAddress()
  );
  await TimelockControllerContract.waitForDeployment();
  console.log(
    'TimelockController Address:',
    await TimelockControllerContract.getAddress()
  );
  const MetaHumanGovernor = await ethers.getContractFactory(
    'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor'
  );
  const metaHumanGovernorContract = await MetaHumanGovernor.deploy(
    vhmTokenAddress,
    TimelockControllerContract.getAddress(),
    [],
    chainId,
    hubAutomaticRelayerAddress,
    magistrateAddress,
    hubSecondsPerBlock,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumFraction
  );

  await metaHumanGovernorContract.waitForDeployment();
  console.log(
    'Governor deployed to:',
    await metaHumanGovernorContract.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
