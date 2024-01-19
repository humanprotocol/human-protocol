// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/EscrowFactory.sol";
import "../src/RewardPool.sol";

contract UpgradeProxiesScript is Script {
    address escrowFactoryProxy = vm.envAddress("ESCROW_FACTORY_PROXY");
    address stakingProxy = vm.envAddress("STAKING_PROXY");
    address rewardPoolProxy = vm.envAddress("REWARD_POOL_PROXY");
    address hmtAddress = vm.envAddress("HMT_ADDRESS");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        console.log("trying with address", vm.addr(deployerPrivateKey));

        // Upgrade EscrowFactory
        EscrowFactory proxyEscrowFactory = EscrowFactory(payable(escrowFactoryProxy));
        address newEscrowFactory = address(new EscrowFactory());
        proxyEscrowFactory.upgradeTo(newEscrowFactory);
        console.log("Upgraded successfully to", newEscrowFactory);

        // Upgrade Staking
        Staking proxyStaking = Staking(payable(stakingProxy));
        address newStaking = address(new Staking());
        proxyStaking.upgradeTo(newStaking);
        console.log("Upgraded successfully to", newStaking);

        // Upgrade RewardPool
        RewardPool proxyRewardPool = RewardPool(payable(rewardPoolProxy));
        address newRewardPool = address(new RewardPool());
        proxyRewardPool.upgradeTo(newRewardPool);
        console.log("Upgraded successfully to", newRewardPool);

        vm.stopBroadcast();
    }
}
