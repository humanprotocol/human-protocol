// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract HubDeployment is Script, DeploymentUtils {
    function run() external {
        vm.startBroadcast(deployerPrivateKey);
        uint16 chainId = uint16(vm.envUint("HUB_WORMHOLE_CHAIN_ID"));
        address vHMTAddress = vm.envAddress("HUB_VOTE_TOKEN_ADDRESS");
        VHMToken voteToken = VHMToken(vHMTAddress);
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](0);
        proposers[0] = address(0);
        executors[0] = address(0);
        TimelockController timelockController = new TimelockController(1, proposers, executors, deployerAddress);
        MetaHumanGovernor governanceContract = new MetaHumanGovernor(voteToken, timelockController, spokeContracts, chainId, hubAutomaticRelayerAddress, magistrateAddress);
        timelockController.grantRole(keccak256("PROPOSER_ROLE"), address(governanceContract));
        timelockController.revokeRole(keccak256("TIMELOCK_ADMIN_ROLE"), deployerAddress);

        vm.stopBroadcast();
    }
}
