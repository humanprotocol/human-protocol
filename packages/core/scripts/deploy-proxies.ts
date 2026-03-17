/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const stakingAddress = process.env.STAKING_ADDRESS;
  if (!stakingAddress) {
    console.error('STAKING_ADDRESS env variable missing');
    return;
  }

  const kvStoreAddress = process.env.KVSTORE_ADDRESS;
  if (!kvStoreAddress) {
    console.error('KVSTORE_ADDRESS env variable missing');
    return;
  }

  const EscrowFactory = await ethers.getContractFactory(
    'contracts/EscrowFactory.sol:EscrowFactory'
  );
  const escrowFactoryContract = await upgrades.deployProxy(
    EscrowFactory,
    [stakingAddress, 1, kvStoreAddress],
    { initializer: 'initialize', kind: 'uups' }
  );
  await escrowFactoryContract.waitForDeployment();
  console.log(
    'Escrow Factory Proxy Address: ',
    await escrowFactoryContract.getAddress()
  );
  console.log(
    'Escrow Factory Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(
      await escrowFactoryContract.getAddress()
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
