/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';
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

  const existingTimelockAddress =
    process.env.HUB_TIMELOCK_CONTROLLER_ADDRESS || '';
  let timelockAddress = existingTimelockAddress;
  if (timelockAddress) {
    console.log('Using existing TimelockController Address:', timelockAddress);
  } else {
    const TimelockController =
      await ethers.getContractFactory('TimelockController');
    const TimelockControllerContract = await TimelockController.deploy(
      1,
      [],
      [],
      await deployer.getAddress()
    );
    await TimelockControllerContract.waitForDeployment();
    timelockAddress = await TimelockControllerContract.getAddress();
    console.log('TimelockController Address:', timelockAddress);
  }
  const MetaHumanGovernor = await ethers.getContractFactory(
    'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor'
  );
  const metaHumanGovernorContract = await upgrades.deployProxy(
    MetaHumanGovernor,
    [
      vhmTokenAddress,
      timelockAddress,
      [],
      chainId,
      hubAutomaticRelayerAddress,
      magistrateAddress,
      hubSecondsPerBlock,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumFraction,
    ],
    { initializer: 'initialize' }
  );
  await metaHumanGovernorContract.waitForDeployment();
  const proxyAddress = await metaHumanGovernorContract.getAddress();
  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log('Governor Proxy deployed at:', proxyAddress);
  console.log('Governor Implementation at:', implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
