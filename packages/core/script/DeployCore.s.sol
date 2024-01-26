// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/EscrowFactory.sol";
import "../src/RewardPool.sol";
import "../src/KVStore.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployCoreScript is Script {
    HMToken public hmToken;
    Staking public staking;
    EscrowFactory public escrowFactory;
    KVStore public kvStore;

    function run() public {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        // Deploy HMT Token
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');

        // Deploy staking proxy
        address stakingImpl = address(new Staking());
        bytes memory stakingData = abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), 1, 1);
        address stakingProxy = address(new ERC1967Proxy(stakingImpl, stakingData));
        staking = Staking(stakingProxy);

        //Deploy Escrow Factory proxy
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
        address escrowFactoryProxy = address(new ERC1967Proxy(escrowFactoryImpl, escrowFactoryData));
        escrowFactory = EscrowFactory(escrowFactoryProxy);

        // Deploy KVStore
        address kvStoreImpl = address(new KVStore());

        // Deploy Reward Pool
        address rewardPoolImpl = address(new RewardPool());
        bytes memory rewardPoolData =
            abi.encodeWithSelector(RewardPool.initialize.selector, address(hmToken), address(staking), 1);
        address rewardPoolProxy = address(new ERC1967Proxy(rewardPoolImpl, rewardPoolData));
        RewardPool rewardPool = RewardPool(rewardPoolProxy);

        // Configure RewardPool in Staking
        staking.setRewardPool(address(rewardPool));

        vm.stopBroadcast();
    }
}
