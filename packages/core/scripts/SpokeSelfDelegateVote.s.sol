// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/vhm-token/VHMToken.sol";
import "../contracts/hm-token/HMToken.sol";

contract SpokeSelfDelegateVote is Script {
    function run() external {
        uint256 secondPrivateKey = vm.envUint("SECOND_PRIVATE_KEY");
        address voteTokenAddress = vm.envAddress("SPOKE_VOTE_TOKEN_ADDRESS");
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
