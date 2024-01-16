// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/Staking.sol";

contract UpgradeProxiesScript is Script {
    address stakingProxy = vm.envAddress("STAKING_PROXY");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        try this.upgradeStakingContract() {
            console.logString("Staking contract upgraded successfully.");
        } catch Error(string memory reason) {
            console.logString(reason);
        } catch (bytes memory lowLevelData) {
            console.logBytes(lowLevelData);
        }

        vm.stopBroadcast();
    }

    function upgradeStakingContract() public {
        require(stakingProxy != address(0), "Staking proxy address is not set");

        Staking proxyStaking = Staking(payable(stakingProxy));
        address newAddress = address(new Staking());
        proxyStaking.upgradeTo(newAddress);
    }
}
