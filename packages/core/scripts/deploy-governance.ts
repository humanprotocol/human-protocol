// SPDX-License-Identifier: UNLICENSED
const { ethers } = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();

  // HMT Deployment 
  const HMToken = await ethers.getContractFactory("HMToken");
  const hmToken = await HMToken.deploy(
    ethers.utils.parseEther("1000"),
    "HMToken", 
    18, 
    "HMT" 
  );
  await hmToken.deployed();
  console.log("HMToken deployed to:", hmToken.address);

  //vHMT Deployment 
  const hmTokenAddress = hmToken.address; 
  if (!hmTokenAddress) {
    throw new Error("HM_TOKEN_ADDRESS environment variable is not set.");
  }

  const VHMToken = await ethers.getContractFactory("VHMToken");
  const vhmToken = await VHMToken.deploy(hmTokenAddress);

  await vhmToken.deployed();

  console.log("VHMToken deployed to:", vhmToken.address);


  // DeployHub 
  const chainId = process.env.HUB_WORMHOLE_CHAIN_ID; 
  const vHMTAddress = process.env.HUB_VOTE_TOKEN_ADDRESS; 
  const voteToken = await ethers.getContractAt("VHMToken", vHMTAddress);

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelockController = await TimelockController.deploy(
    1, 
    [], 
    [] 
  );

  const MetaHumanGovernor = await ethers.getContractFactory("MetaHumanGovernor");
  const governanceContract = await MetaHumanGovernor.deploy(
    voteToken.address,
    timelockController.address,
    [], 
    chainId,
    process.env.HUB_AUTOMATIC_RELAYER_ADDRESS, 
    process.env.MAGISTRATE_ADDRESS, 
    process.env.TARGET_SECONDS_PER_BLOCK 
  );

  await governanceContract.deployed();

  const PROPOSER_ROLE = await timelockController.PROPOSER_ROLE();
  await timelockController.grantRole(PROPOSER_ROLE, governanceContract.address);

  const TIMELOCK_ADMIN_ROLE = await timelockController.TIMELOCK_ADMIN_ROLE();
  await timelockController.revokeRole(TIMELOCK_ADMIN_ROLE, deployer.address);

  console.log("Governance Contract Address:", governanceContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
