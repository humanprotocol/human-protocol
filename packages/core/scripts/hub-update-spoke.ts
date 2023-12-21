/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const spokeAddressesEnv = process.env.SPOKE_ADDRESSES || '';
  const spokeChainIdsEnv = process.env.SPOKE_WORMHOLE_CHAIN_IDS || '';

  if (!deployerPrivateKey || !governorAddress) {
    throw new Error(
      'Environment variables PRIVATE_KEY or GOVERNOR_ADDRESS are not set.'
    );
  }

  const spokeAddresses = spokeAddressesEnv.split(',');
  const spokeChainIds = spokeChainIdsEnv.split(',').map((id) => parseInt(id));

  if (spokeAddresses.length !== spokeChainIds.length) {
    throw new Error(
      'Please provide the same number of addresses as chain IDs.'
    );
  }

  const spokeContracts = spokeAddresses.map((address, index) => {
    return {
      contractAddress: ethers.utils.hexZeroPad(address, 32),
      chainId: spokeChainIds[index],
    };
  });

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor',
    deployerSigner
  );
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const tx = await governanceContract.updateSpokeContracts(spokeContracts);
  await tx.wait();

  console.log('Spoke contracts updated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
