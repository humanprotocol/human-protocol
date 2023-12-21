/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Ensure this path is correct

async function main() {
  const utils = new DeploymentUtils();

  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const chainId = parseInt(process.env.SPOKE_WORMHOLE_CHAIN_ID || '0');
  const vHMTokenAddress = process.env.SPOKE_VOTE_TOKEN_ADDRESS || '';
  const spokeAutomaticRelayerAddress =
    process.env.SPOKE_AUTOMATIC_RELAYER_ADDRESS || '';

  if (
    !deployerPrivateKey ||
    !governorAddress ||
    !vHMTokenAddress ||
    !spokeAutomaticRelayerAddress
  ) {
    throw new Error('Environment variables are not set correctly.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const VHMToken = await ethers.getContractFactory('VHMToken', deployerSigner);
  const voteToken = VHMToken.attach(vHMTokenAddress);

  const DAOSpokeContract = await ethers.getContractFactory(
    'DAOSpokeContract',
    deployerSigner
  );
  const daoSpokeContract = await DAOSpokeContract.deploy(
    ethers.utils.hexZeroPad(governorAddress, 32),
    utils.hubChainId,
    voteToken.address,
    utils.targetSecondsPerBlock,
    chainId,
    spokeAutomaticRelayerAddress
  );

  await daoSpokeContract.deployed();
  console.log('DAOSpokeContract deployed to:', daoSpokeContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
