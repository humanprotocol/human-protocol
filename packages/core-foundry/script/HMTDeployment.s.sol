// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract HMTDeployment is Script, DeploymentUtils {
    function run() external {
        vm.startBroadcast(deployerPrivateKey);

        new HMToken(1000 ether, "HMToken", 18, "HMT");

        vm.stopBroadcast();
    }
}
