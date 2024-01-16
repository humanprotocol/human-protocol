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
    Escrow public escrow;
    EscrowFactory public escrowFactory;
    RewardPool public rewardPool;
    KVStore public kvStore;

    function run() public {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        // Deploy Staking contract
        staking = Staking(payable(address(new Staking())));

        // Deploy HMT Token
        HMToken hmtToken = new HMToken(1000000000, "HMT", 18, "HMT");

        // Deploy EscrowFacory contract
        EscrowFactory escrowFactoryImpl = new EscrowFactory();

        // Deploy KVStore
        KVStore kvStoreImpl = new KVStore();

        vm.stopBroadcast();
    }
}
