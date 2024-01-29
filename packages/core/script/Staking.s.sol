// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";

contract StakingScript is Script {
    address stakingProxy = vm.envAddress("STAKING_PROXY");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");
    Staking public staking;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        bytes memory data = abi.encodeWithSelector(Staking.stake.selector, 3);
        (bool success,) = stakingProxy.call(data);
        require(success, "Stake function call failed");
        vm.stopBroadcast();
    }
}
