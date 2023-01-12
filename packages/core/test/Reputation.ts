import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { HMToken, Reputation, Staking } from '../typechain-types';

describe('Reputation', function () {
  let owner: Signer, reputationOracle: Signer;

  let token: HMToken, reputation: Reputation, staking: Staking;

  const minimumStake = 1;
  const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';

  const reputationValues = [
    { workerAddress: worker1, reputation: 10 },
    { workerAddress: worker2, reputation: -10 },
  ];

  async function getReputations() {
    const result = await reputation
      .connect(reputationOracle)
      .getReputations([worker1, worker2]);

    return result;
  }

  this.beforeAll(async () => {
    [owner, reputationOracle] = await ethers.getSigners();

    // Deploy HMToken Contract
    const HMToken = await ethers.getContractFactory('HMToken');
    token = await HMToken.deploy(1000000000, 'Human Token', 18, 'HMT');

    // Send HMT tokens to the operator
    await token
      .connect(owner)
      .transfer(await reputationOracle.getAddress(), 1000);
  });

  this.beforeEach(async () => {
    // Deploy Staking Conract
    const Staking = await ethers.getContractFactory('Staking');
    staking = (await upgrades.deployProxy(Staking, [token.address, 2, 2], {
      kind: 'uups',
      initializer: 'initialize',
    })) as Staking;

    // Approve spend HMT tokens staking contract
    await token.connect(reputationOracle).approve(staking.address, 100);

    // Deploy Reputation Contract
    const Reputation = await ethers.getContractFactory('Reputation');

    reputation = await Reputation.deploy(staking.address, minimumStake);
  });

  it('Should set the right staking address', async () => {
    const result = await reputation.staking();
    expect(result).to.equal(staking.address);
  });

  it('Should set the right minimun amount of staking', async () => {
    const result = await reputation.minimumStake();
    expect(Number(result)).to.equal(minimumStake);
  });

  it('Should get 0 for non-setted reputations', async () => {
    const reputations = await getReputations();
    expect(reputations[0].workerAddress).to.equal(worker1);
    expect(reputations[0].reputation).to.equal('0');
    expect(reputations[1].workerAddress).to.equal(worker2);
    expect(reputations[1].reputation).to.equal('0');
  });

  it('Should not allow to modify reputation without stake', async () => {
    await expect(
      reputation.connect(reputationOracle).addReputations(reputationValues)
    ).to.be.revertedWith('Needs to stake HMT tokens to modify reputations.');
  });

  it('Should modify reputation after stake', async () => {
    await staking.connect(reputationOracle).stake(10);
    await reputation.connect(reputationOracle).addReputations(reputationValues);

    let reputations = await getReputations();
    expect(reputations[0].workerAddress).to.equal(worker1);
    expect(reputations[0].reputation).to.equal('60');
    expect(reputations[1].workerAddress).to.equal(worker2);
    expect(reputations[1].reputation).to.equal('40');

    await reputation.connect(reputationOracle).addReputations(reputationValues);

    reputations = await getReputations();
    expect(reputations[0].workerAddress).to.equal(worker1);
    expect(reputations[0].reputation).to.equal('70');
    expect(reputations[1].workerAddress).to.equal(worker2);
    expect(reputations[1].reputation).to.equal('30');
  });

  it('Should calculate the rewards', async () => {
    await staking.connect(reputationOracle).stake(10);
    await reputation.connect(reputationOracle).addReputations(reputationValues);

    const rewards = await reputation.getRewards(
      ethers.utils.parseUnits('1', 'ether'),
      [worker1, worker2]
    );

    expect(rewards[0]).to.equal(ethers.utils.parseUnits('0.6', 'ether'));
    expect(rewards[1]).to.equal(ethers.utils.parseUnits('0.4', 'ether'));
  });

  it('Check reputation limits', async () => {
    await staking.connect(reputationOracle).stake(10);
    await reputation.connect(reputationOracle).addReputations([
      { workerAddress: worker1, reputation: 80 },
      { workerAddress: worker2, reputation: -80 },
    ]);

    const reputations = await getReputations();
    expect(reputations[0].workerAddress).to.equal(worker1);
    expect(reputations[0].reputation).to.equal('100');
    expect(reputations[1].workerAddress).to.equal(worker2);
    expect(reputations[1].reputation).to.equal('1');
  });
});
