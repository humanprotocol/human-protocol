// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/Staking.sol";

contract UpgradeProxiesScript is Script {
    address stakingProxy = vm.envAddress("STAKING_PROXY");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");
    address newImpl = vm.envAddress("NEW_IMPL");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
    
        vm.startBroadcast(deployerPrivateKey);
        this.upgradeStakingContract();
        vm.stopBroadcast();
    }

    function upgradeStakingContract() public {
        require(stakingProxy != address(0), "Staking proxy address is not set");

        Staking proxyStaking = Staking(payable(stakingProxy));
        console.logAddress(proxyStaking.owner());
        proxyStaking.upgradeTo(newImpl);
    }
}
