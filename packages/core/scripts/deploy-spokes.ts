// SPDX-License-Identifier: UNLICENSED
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const deployer = await ethers.getSigners();
  const hubChainId = process.env.HUB_WORMHOLE_CHAIN_ID;
  const governorAddress = process.env.GOVERNOR;
  const spokeChainId = process.env.SPOKE_WORMHOLE_CHAIN_ID;
  const vHMTokenAddress = process.env.SPOKE_VOTE_TOKEN_ADDRESS;
  const spokeAutomaticRelayerAddress =
    process.env.SPOKE_AUTOMATIC_RELAYER_ADDRESS;
  const magistrateAddress = process.env.MAGISTRATE_ADDRESS;
  const targetSecondsPerBlock = process.env.TARGET_SECONDS_PER_BLOCK;

  if (
    !governorAddress ||
    !vHMTokenAddress ||
    !spokeAutomaticRelayerAddress ||
    !magistrateAddress
  ) {
    throw new Error('One or more required environment variables are missing');
  }

  const DAOSpokeContractFactory =
    await ethers.getContractFactory('DAOSpokeContract');
  const daoSpokeContract = await DAOSpokeContractFactory.deploy(
    ethers.zeroPadValue(governorAddress, 32),
    hubChainId,
    vHMTokenAddress,
    targetSecondsPerBlock,
    spokeChainId,
    spokeAutomaticRelayerAddress,
    magistrateAddress
  );

  await daoSpokeContract.waitForDeployment();
  console.log(
    'DAOSpokeContract deployed to:',
    await daoSpokeContract.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
