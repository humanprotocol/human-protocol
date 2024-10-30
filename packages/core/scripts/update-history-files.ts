/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';
async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const stakingAddress = process.env.STAKING_ADDRESS;
  if (!(escrowFactoryAddress && stakingAddress)) {
    console.error('Env variable missing');
    return;
  }

  const EscrowFactory = await ethers.getContractFactory(
    'contracts/EscrowFactory.sol:EscrowFactory'
  );
  await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, {
    kind: 'uups',
  });

  const Staking = await ethers.getContractFactory('Staking');
  await upgrades.forceImport(stakingAddress, Staking, { kind: 'uups' });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
