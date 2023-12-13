require("dotenv").config();
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai");
const { defaultAbiCoder } = require("@ethersproject/abi");
describe("Interacting with governance ecosystem", function () {
    let deployer, addr1, addr2;
    let hmtoken;
    let vhmtoken;
    let governanceContract;
    let proposalId;

    async function deployHMTokenFixture() {
        const HMToken = await ethers.getContractFactory("HMToken");
        hmtoken = await HMToken.deploy(
            100, "HMToken", 18, "HMT"
        );
        await hmtoken.waitForDeployment();

        return {
            contractAddress: hmtoken.target,
            from: hmtoken.runner.address
        }
    }
    async function deployVHMTokenFixture() {
        const VHMToken = await ethers.getContractFactory("VHMToken");
        vhmtoken = await VHMToken.deploy(hmtoken);
        await vhmtoken.waitForDeployment();

        return {
            contractAddress: vhmtoken.target,
            from: vhmtoken.runner.address
        }
    }

    async function deployMetaHumanGovernorFixture() {
        const deployerAddress = await deployer.getAddress();

        const GovernanceContract = await ethers.getContractFactory("MetaHumanGovernor");
        governanceContract = await GovernanceContract.deploy(
            vhmtoken.target,
            process.env.TIMELOCK_ADDRESS,
            [], //spokeContracts
            parseInt(process.env.HUB_CHAIN_ID),
            process.env.HUB_CORE_BRIDGE_ADDRESS,
            deployerAddress
        );
        await governanceContract.waitForDeployment();

        return {
            contractAddress: governanceContract.target,
            from: governanceContract.runner.address
        }
    }

    before(async function() {
        [deployer, addr1, addr2] = await ethers.getSigners();
    });

    it("Should deploy HM token", async function () {
        const { contractAddress, from } = await loadFixture(deployHMTokenFixture);
        expect(contractAddress).to.exist;
        expect(from).equal(deployer.address)
    });

    it("Should deploy VHM token", async function () {
        const { contractAddress, from } = await loadFixture(deployVHMTokenFixture);
        expect(contractAddress).to.exist;
        expect(from).equal(deployer.address)
    });

    it("Should deploy MetaHuman Governor", async function () {
        const { contractAddress, from } = await loadFixture(deployMetaHumanGovernorFixture);
        expect(contractAddress).to.exist;
        expect(from).equal(deployer.address)
    });

    it("Create proposal: Should broadcast the message to all the spokes", async function () {
        const deployerAddress = await deployer.getAddress();
        const targets = [vhmtoken.target];
        const values = [0];
        const encodedCall = defaultAbiCoder.encode(
            ["address", "uint256"],
            [deployerAddress, 50]
        );
        const callDatas = [encodedCall];
        const desc = "DESCRIPTION";
        try {
            proposalId = await governanceContract.crossChainPropose(
                targets,
                values,
                callDatas,
                desc
            );
        }
        catch (e) {
            console.error(e)
        }

        expect(proposalId).to.exist;
        expect(proposalId.blockHash).to.exist;
        expect(proposalId.from).equal(deployer.address)
        expect(proposalId.data).is.not.null;
    });
});