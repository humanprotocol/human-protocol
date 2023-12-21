/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Assuming this file contains the necessary configurations

async function main() {
  const utils = new DeploymentUtils();
  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const secondPrivateKey = process.env.SECOND_PRIVATE_KEY || '';
  const thirdPrivateKey = process.env.THIRD_PRIVATE_KEY || '';
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const spokeAutomaticRelayerAddress =
    process.env.SPOKE_AUTOMATIC_RELAYER_ADDRESS || '';
  const spokeChainId = parseInt(process.env.SPOKE_CHAIN_ID || '0');

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  const secondSigner = new ethers.Wallet(secondPrivateKey, ethers.provider);
  const thirdSigner = new ethers.Wallet(thirdPrivateKey, ethers.provider);

  const HMToken = await ethers.getContractFactory('HMToken', deployerSigner);
  const hmToken = await HMToken.deploy(
    ethers.utils.parseEther('1000'),
    'HMToken',
    18,
    'HMT'
  );
  await hmToken.deployed();

  const VHMToken = await ethers.getContractFactory('VHMToken', deployerSigner);
  const voteToken = await VHMToken.deploy(hmToken.address);
  await voteToken.deployed();

  await (
    await hmToken.transfer(secondSigner.address, ethers.utils.parseEther('100'))
  ).wait();
  await (
    await hmToken.transfer(thirdSigner.address, ethers.utils.parseEther('100'))
  ).wait();

  const DAOSpokeContract = await ethers.getContractFactory(
    'DAOSpokeContract',
    deployerSigner
  );
  await DAOSpokeContract.deploy(
    ethers.utils.hexZeroPad(governorAddress, 32),
    utils.hubChainId,
    voteToken.address,
    utils.targetSecondsPerBlock,
    spokeChainId,
    spokeAutomaticRelayerAddress
  );

  await hmToken
    .connect(secondSigner)
    .approve(voteToken.address, ethers.utils.parseEther('20'));
  await voteToken
    .connect(secondSigner)
    .depositFor(secondSigner.address, ethers.utils.parseEther('20'));

  await hmToken
    .connect(thirdSigner)
    .approve(voteToken.address, ethers.utils.parseEther('20'));
  await voteToken
    .connect(thirdSigner)
    .depositFor(thirdSigner.address, ethers.utils.parseEther('20'));

  console.log('Spoke testing environment setup complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
