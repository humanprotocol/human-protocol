// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import "../src/Staking.sol";

contract UpgradeProxiesScript is Script {
    address stakingProxy = vm.envAddress("STAKING_PROXY");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("trying with address", vm.addr(deployerPrivateKey));

        Staking proxyStaking = Staking(payable(stakingProxy));
        address newAddress = address(new Staking());
        proxyStaking.upgradeTo(newAddress);
        
        console.log("Upgraded successfully to", newAddress);

        vm.stopBroadcast();
    }
}
