/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Assuming this file contains the necessary configurations

async function main() {
  const utils = new DeploymentUtils();

  const secondPrivateKey = process.env.SECOND_PRIVATE_KEY || '';
  const thirdPrivateKey = process.env.THIRD_PRIVATE_KEY || '';
  const secondSigner = new ethers.Wallet(secondPrivateKey, ethers.provider);
  const thirdSigner = new ethers.Wallet(thirdPrivateKey, ethers.provider);

  const HMToken = await ethers.getContractFactory('HMToken');
  const hmToken = await HMToken.deploy(
    ethers.utils.parseEther('1000'),
    'HMToken',
    18,
    'HMT'
  );
  await hmToken.deployed();

  await (
    await hmToken.transfer(secondSigner.address, ethers.utils.parseEther('100'))
  ).wait();
  await (
    await hmToken.transfer(thirdSigner.address, ethers.utils.parseEther('100'))
  ).wait();

  const VHMToken = await ethers.getContractFactory('VHMToken');
  const voteToken = await VHMToken.deploy(hmToken.address);
  await voteToken.deployed();

  const TimelockController = await ethers.getContractFactory(
    'TimelockController'
  );
  const proposers = [utils.deployerAddress];
  const executors = [ethers.constants.AddressZero];
  const timelockController = await TimelockController.deploy(
    1,
    proposers,
    executors,
    utils.deployerAddress
  );
  await timelockController.deployed();

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor'
  );
  const governanceContract = await MetaHumanGovernor.deploy(
    voteToken.address,
    timelockController.address,
    [],
    utils.hubChainId,
    utils.hubAutomaticRelayerAddress,
    utils.deployerAddress
  );
  await governanceContract.deployed();

  const PROPOSER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('PROPOSER_ROLE')
  );
  const TIMELOCK_ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('TIMELOCK_ADMIN_ROLE')
  );
  await timelockController.grantRole(PROPOSER_ROLE, governanceContract.address);
  await timelockController.revokeRole(
    TIMELOCK_ADMIN_ROLE,
    utils.deployerAddress
  );

  await hmToken
    .connect(secondSigner)
    .approve(voteToken.address, ethers.utils.parseEther('10'));
  await voteToken
    .connect(secondSigner)
    .depositFor(secondSigner.address, ethers.utils.parseEther('10'));

  await hmToken
    .connect(thirdSigner)
    .approve(voteToken.address, ethers.utils.parseEther('10'));
  await voteToken
    .connect(thirdSigner)
    .depositFor(thirdSigner.address, ethers.utils.parseEther('10'));

  console.log('Hub testing setup complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
