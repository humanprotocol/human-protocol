import { ethers } from "hardhat";
import { Signer } from "ethers";

const fs = require("fs");
const path = require("path");

const ADDRESS_OUTPUT_FILENAME = "../hmt.address.json";

async function main() {
  let owner: Signer
  [
    owner
  ] = await ethers.getSigners();

  console.log("Owner Address: ", await owner.getAddress())

  // Deploy HMT token
  const HMToken = await ethers.getContractFactory("HMToken");
  const token = await HMToken.deploy(
    1000000000,
    "Human Token",
    18,
    "HMT"
  );
  await token.deployed()
  console.log("HMToken Address: ", token.address)

  // Deploy Escrow Factory Contract
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(token.address);
  await escrowFactory.deployed()
  console.log("Escrow Factory Address: ", escrowFactory.address)

  const fileContent = {
    address: token,
  };

  try {
    fs.mkdirSync(path.dirname(ADDRESS_OUTPUT_FILENAME));
  } catch (err: any) {
    if (err.code !== "EEXIST") throw err;
  }

  fs.writeFile(
    ADDRESS_OUTPUT_FILENAME,
    JSON.stringify(fileContent, null, 2),
    (err: any) => {
      if (err) {
        console.error(
          `Unable to write address to output file: ${ADDRESS_OUTPUT_FILENAME}`
        );
      } else {
        console.log(
          `Deployed hmt token address stored in ${ADDRESS_OUTPUT_FILENAME}`
        );
      }
    }
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
