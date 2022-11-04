import hre, { ethers } from 'hardhat';

async function main() {
  const HMToken = await ethers.getContractFactory('HMToken');
  const HMTokenContract = await HMToken.deploy(
    1000000000,
    'Human Token',
    18,
    'HMT'
  );
  await HMTokenContract.deployed();
  console.log('HMToken Address: ', HMTokenContract.address);

  const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
  const escrowFactoryContract = await EscrowFactory.deploy(
    HMTokenContract.address
  );
  await escrowFactoryContract.deployed();
  console.log('Escrow Factory Address: ', escrowFactoryContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
