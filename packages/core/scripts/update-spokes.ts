import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const spokeAddresses = process.env.SPOKE_ADDRESSES?.split(',') || '';
  const spokeChainIds = process.env.SPOKE_WORMHOLE_CHAIN_IDS?.split(',') || '';

  if (!governorAddress || !spokeAddresses || !spokeChainIds) {
    throw new Error('One or more required environment variables are missing');
  }

  if (spokeAddresses.length !== spokeChainIds.length) {
    throw new Error('Please provide the same amount of addresses as chain IDs');
  }

  const governanceContract = await ethers.getContractAt(
    'MetaHumanGovernor',
    governorAddress,
    deployer
  );

  const spokeContracts = spokeAddresses.map((address, index) => ({
    contractAddress: ethers.zeroPadValue(address, 32),
    chainId: spokeChainIds[index],
  }));

  console.log('Updating spoke contracts...');
  // can only be called by the governor
  const transaction =
    await governanceContract.updateSpokeContracts(spokeContracts);
  await transaction.wait();
  console.log(
    'Spoke contracts updated successfully. TxHash:',
    transaction.hash
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
