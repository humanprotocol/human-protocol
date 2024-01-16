// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Staking.sol";
import "../src/RewardPool.sol";
import "../src/KVStore.sol";
import "../src/EscrowFactory.sol";
import "../src/HMToken.sol";
import "../src/Escrow.sol";

contract DeployCoreScript is Script {
    Staking public staking;
   

    function run() public {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        // Deploy Staking contract
        staking = new Staking();

        vm.stopBroadcast();
    }
}
