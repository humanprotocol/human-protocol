// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract CastVote is Script, DeploymentUtils {
    function run() external {
        uint256 secondPrivateKey = vm.envUint("SECOND_PRIVATE_KEY");
        address payable governorAddress = payable(vm.envAddress("GOVERNOR_ADDRESS"));
        vm.startBroadcast(secondPrivateKey);
        MetaHumanGovernor governanceContract = MetaHumanGovernor(governorAddress);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) = getProposalExecutionData();

        uint256 proposalId = governanceContract.hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        governanceContract.castVote(proposalId, 1);

        vm.stopBroadcast();
    }
}
