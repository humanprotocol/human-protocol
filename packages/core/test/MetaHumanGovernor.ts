/* eslint-disable @typescript-eslint/no-explicit-any */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import {
  TimelockController,
  DAOSpokeContract,
  MetaHumanGovernor,
  HMToken,
  VHMToken,
} from '../typechain-types';

let metaHumanGovernor: MetaHumanGovernor,
  vhmToken: VHMToken,
  hmToken: HMToken,
  daoSpokeContract: DAOSpokeContract,
  timelockController: TimelockController;
let owner: Signer, addr1: Signer, addr2: Signer, trustedHandlers: Signer[];

async function deployMetaHumanGovernor() {
  const MetaHumanGovernor = await ethers.getContractFactory(
    'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor'
  );
  const VHMToken = await ethers.getContractFactory(
    'contracts/governance/vhm-token/VHMToken.sol:VHMToken'
  );
  const HMToken = await ethers.getContractFactory(
    'contracts/HMToken.sol:HMToken'
  );
  const DAOSpokeContract = await ethers.getContractFactory(
    'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
  );
  const TimelockController =
    await ethers.getContractFactory('TimelockController');

  hmToken = (await HMToken.deploy(100000, 'HMToken', 18, 'HMT')) as HMToken;
  vhmToken = (await VHMToken.deploy(hmToken.getAddress())) as VHMToken;

  await hmToken.approve(vhmToken.getAddress(), 10);
  await vhmToken.depositFor(owner.getAddress(), 10);
}
