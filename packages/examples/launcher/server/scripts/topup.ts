import { ethers } from "hardhat";
import { Signer } from "ethers";

const fs = require("fs");
const path = require("path");

const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

const connectDb = async () => {
  try {
    const client = new Client({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT
    })

    await client.connect()
    return client;
  } catch (error) {
    console.log(error)
  }
}

const ADDRESS_OUTPUT_FILENAME = "../hmt.address.json";

async function main() {
  const client = await connectDb();
  const jobs = await client.query('SELECT * FROM job ORDER BY created_at DESC LIMIT 10')

  let owner: Signer,
    operator: Signer
  [
    owner,
    operator,
  ] = await ethers.getSigners();

  console.log("Owner Address: ", await owner.getAddress())
  console.log("Operator Address: ", await operator.getAddress())

  // Attach to HMT token
  const HMToken = await ethers.getContractFactory("HMToken");

  const token = await HMToken.attach(process.env.WEB3_HMT_TOKEN || "")
  console.log("HMToken Address: ", token.address)

  // Attach to Escrow Factory Contract
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.attach(process.env.WEB3_ESCROW_FACTORY_ADDRESS || "")
  console.log("Escrow Factory Address: ", escrowFactory.address)

  // Send HMT tokens to contract participants
  await token.connect(owner).approve(await operator.getAddress(), ethers.utils.parseUnits('1000', 18));

  await token
    .connect(operator)
    .transferFrom(
      await owner.getAddress(),
      await operator.getAddress(),
      ethers.utils.parseUnits('1000', 18)
    );

  await token
      .connect(owner)
      .transfer(
        escrowFactory.address,
        ethers.utils.parseUnits('100', 18)
      );

  const balance1 = (await token.connect(owner).balanceOf(escrowFactory.address)).toString();
  console.log(`Balance of Escrow Factory equal ${ethers.utils.formatEther(balance1)} ${await token.symbol()}`)
  console.log(balance1)

  await token
      .connect(owner)
      .transfer(
        await operator.getAddress(),
        ethers.utils.parseUnits('100', 18)
      );

  const balance2 = (await token.connect(owner).balanceOf(escrowFactory.address)).toString();
  console.log(`Balance of Operator equal ${ethers.utils.formatEther(balance2)} ${await token.symbol()}`)
  console.log(balance2)

  console.log(`Gas price ${(ethers.utils.formatEther(await ethers.provider.getGasPrice()))}`)

  await Promise.all(jobs?.rows.map(async job => {
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.attach(job.escrow_address)
    await token
        .connect(owner)
        .transfer(
          await escrow.address,
          ethers.utils.parseUnits('100', 18)
        );
  
    const balance3 = (await token.connect(owner).balanceOf(escrow.address)).toString();
    console.log(`Escrow Address ${escrow.address } with balance equal ${ethers.utils.formatEther(balance3)} ${await token.symbol()}`)
    console.log(balance3)
  }))

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

  await client.end()
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
