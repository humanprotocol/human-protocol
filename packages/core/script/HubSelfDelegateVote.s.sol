// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";

contract HubSelfDelegateVote is Script {
    function run() external {
        uint256 secondPrivateKey = vm.envUint("SECOND_PRIVATE_KEY");
        address voteTokenAddress = vm.envAddress("HUB_VOTE_TOKEN_ADDRESS");
        vm.startBroadcast(secondPrivateKey);
        address secondAddress = vm.addr(secondPrivateKey);
        VHMToken vhmToken = VHMToken(voteTokenAddress);

        vhmToken.delegate(secondAddress);

        vm.stopBroadcast();

        uint256 thirdPrivateKey = vm.envUint("THIRD_PRIVATE_KEY");
        vm.startBroadcast(thirdPrivateKey);
        address thirdAddress = vm.addr(thirdPrivateKey);

        vhmToken.delegate(thirdAddress);

        vm.stopBroadcast();
    }
}
