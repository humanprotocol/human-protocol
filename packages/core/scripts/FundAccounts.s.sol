// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/vhm-token/VHMToken.sol";
import "../contracts/hm-token/HMToken.sol";

contract FundAccounts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        HMToken hmToken = HMToken((vm.envAddress("HM_TOKEN_ADDRESS")));
        vm.startBroadcast(deployerPrivateKey);
        address secondAddress = vm.envAddress("ADDRESS_TO_FUND");

        hmToken.transfer(secondAddress, 1000000 ether);
    }
}
