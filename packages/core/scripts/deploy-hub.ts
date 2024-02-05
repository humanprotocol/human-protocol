/* eslint-disable no-console */
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  // HMTDeployment
  const HMToken = await ethers.getContractFactory(
    'contracts/HMToken.sol:HMToken'
  );
  const HMTokenContract = await HMToken.deploy(
    1000000000,
    'Human Token',
    18,
    'HMT'
  );
  await HMTokenContract.waitForDeployment();
  console.log('HMToken Address: ', await HMTokenContract.getAddress());

  //vHMT Deployment
  const hmTokenAddress = HMTokenContract.getAddress();
  if (!hmTokenAddress) {
    throw new Error('HM_TOKEN_ADDRESS environment variable is not set');
  }

  const VHMToken = await ethers.getContractFactory(
    'contracts/governance/vhm-token/VHMToken.sol:VHMToken'
  );
  const VHMTokenContract = await VHMToken.deploy(hmTokenAddress);
  await VHMTokenContract.waitForDeployment();
  console.log('VHMToken deployed to:', await VHMTokenContract.getAddress());

  //DeployHUB
  const chainId = process.env.HUB_WORMHOLE_CHAIN_ID;
  const hubAutomaticRelayerAddress =
    process.env.HUB_AUTOMATIC_RELAYER_ADDRESS ?? '';
  const magistrateAddress = process.env.MAGISTRATE_ADDRESS ?? '';
  const hubSecondsPerBlock = process.env.HUB_SECONDS_PER_BLOCK
    ? parseInt(process.env.HUB_SECONDS_PER_BLOCK)
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
    VHMTokenContract.getAddress(),
    TimelockControllerContract.getAddress(),
    [],
    chainId,
    hubAutomaticRelayerAddress,
    magistrateAddress,
    hubSecondsPerBlock
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
