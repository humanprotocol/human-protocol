// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract QueueProposal is Script, DeploymentUtils {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable governorAddress = payable(vm.envAddress("GOVERNOR_ADDRESS"));
        MetaHumanGovernor governanceContract = MetaHumanGovernor(governorAddress);
        vm.startBroadcast(deployerPrivateKey);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) = getProposalExecutionData();

        governanceContract.queue(targets, values, calldatas, keccak256(bytes(description)));


        vm.stopBroadcast();
    }
}
