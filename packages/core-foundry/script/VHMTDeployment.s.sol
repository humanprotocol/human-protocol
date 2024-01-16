// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/vhm-token/VHMToken.sol";
import "./DeploymentUtils.sol";

contract VHMTDeployment is Script, DeploymentUtils {
    function run() external {
        address hmTokenAddress = vm.envAddress("HM_TOKEN_ADDRESS");
        vm.startBroadcast(deployerPrivateKey);

        new VHMToken(IERC20(hmTokenAddress));

        vm.stopBroadcast();
    }
}
