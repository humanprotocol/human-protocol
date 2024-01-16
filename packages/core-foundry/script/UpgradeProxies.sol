// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/Staking.sol";

contract UpgradeProxiesScript is Script {
    address myProxyAddress = vm.envAddress("STAKING_PROXY_ADDRESS");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Upgrade proxy contract 
        Staking proxy = Staking(payable(myProxyAddress));
        address newAddress = address(new Staking());
        proxy.upgradeTo(newAddress);
        vm.stopBroadcast();
    }
}
