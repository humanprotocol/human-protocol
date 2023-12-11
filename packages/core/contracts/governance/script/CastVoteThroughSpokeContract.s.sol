// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract CastVoteThroughSpokeContract is Script, DeploymentUtils {
    function run() external {
        uint256 thirdPrivateKey = vm.envUint("THIRD_PRIVATE_KEY");
        address payable spokeAddress = payable(vm.envAddress("SPOKE_1_ADDRESS"));
        vm.startBroadcast(thirdPrivateKey);
        DAOSpokeContract spokeContract = DAOSpokeContract(spokeAddress);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) = getProposalExecutionData();

        //calculate hash based on lib/openzeppelin-contracts/contracts/governance/Governor.sol:133
        uint256 proposalId = uint256(keccak256(abi.encode(targets, values, calldatas, keccak256(bytes(description)))));
        spokeContract.castVote(proposalId, 1);

        vm.stopBroadcast();
    }
}
