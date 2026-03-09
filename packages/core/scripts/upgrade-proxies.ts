/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';
import type { EscrowFactory } from '../typechain-types';

async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const kvStoreAddress = process.env.KVSTORE_ADDRESS;

  if (!escrowFactoryAddress) {
    console.error('Env variable missing');
    return;
  }

  if (escrowFactoryAddress) {
    const EscrowFactory = await ethers.getContractFactory(
      'contracts/EscrowFactory.sol:EscrowFactory'
    );
    // await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, { kind: 'uups' });  //use this to get ./openzeppelin/[network].json
    const escrowFactoryContract = await upgrades.upgradeProxy(
      escrowFactoryAddress,
      EscrowFactory
    );
    const contract = await escrowFactoryContract.waitForDeployment();
    const hash = contract.deploymentTransaction()?.hash;
    if (hash) {
      await ethers.provider.getTransactionReceipt(hash);
    }

    const escrowFactory = (await ethers.getContractAt(
      'contracts/EscrowFactory.sol:EscrowFactory',
      await escrowFactoryContract.getAddress()
    )) as unknown as EscrowFactory;

    console.log(
      'Escrow Factory Proxy Address: ',
      await escrowFactory.getAddress()
    );
    console.log(
      'New Escrow Factory Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        await escrowFactory.getAddress()
      )
    );

    const currentKvStoreAddress = await escrowFactory.kvstore();
    if (currentKvStoreAddress === ethers.ZeroAddress) {
      if (!kvStoreAddress) {
        console.error(
          'KVSTORE_ADDRESS env variable missing and factory kvstore is not set'
        );
        return;
      }

      const setKvStoreTx =
        await escrowFactory.setKVStoreAddress(kvStoreAddress);
      await setKvStoreTx.wait();
      console.log('KVStore Address initialized to: ', kvStoreAddress);
    } else {
      console.log('KVStore Address already set: ', currentKvStoreAddress);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
