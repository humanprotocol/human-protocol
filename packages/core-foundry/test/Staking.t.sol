pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/RewardPool.sol";
import "../src/EscrowFactory.sol";
import "./StakingUtils.t.sol";

contract StakingTest is StakingUtils {
    Staking public staking;
    HMToken public hmToken;
    RewardPool public rewardPool;
    EscrowFactory public escrowFactory;

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1, 'Human Token', 10, 'HMT');
        // Loop through accounts and approve HMToken for each account
        for (uint256 i = 0; i < accounts.length; i++) {
            hmToken.approve(accounts[i], 1000);
        }

        // Deploy Staking Proxy
        address stakingImpl = address(new Staking());
        bytes memory stakingData = abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), 1, 1);
        address stakingProxy = address(new ERC1967Proxy(stakingImpl, stakingData));
        staking = Staking(stakingProxy);

        //Deploy Escrow Factory proxy
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, stakingImpl);
        address escrowFactoryProxy = address(new ERC1967Proxy(escrowFactoryImpl, escrowFactoryData));
        escrowFactory = EscrowFactory(escrowFactoryProxy);

        // Deploy Reward Pool
        address rewardPoolImpl = address(new RewardPool());
        bytes memory rewardPoolData =
            abi.encodeWithSelector(RewardPool.initialize.selector, address(hmToken), address(staking), 1);
        address rewardPoolProxy = address(new ERC1967Proxy(rewardPoolImpl, rewardPoolData));
        RewardPool rewardPool = RewardPool(rewardPoolProxy);

        // Topup staking address
        hmToken.transfer(address(staking), 1000);

        // Approve spend HMT tokens staking contract
        hmToken.approve(address(staking), 1000);

        vm.stopPrank();
    }

    function testInitValidations() public {
        assertEq(staking.token(), address(hmToken), "Should set the right token address");
        assertEq(staking.minimumStake(), 1, "Should set the right minimum stake");
        assertEq(staking.lockPeriod(), 1, "Should set the right staking period");
    }

    function testFail_StakeValidations() public {
        vm.startPrank(operator);
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.stake(0); 
        vm.expectRevert("TOTAL_STAKE_BELOW_MINIMUM_THRESHOLD");
        staking.stake(1);
        vm.stopPrank();
    }
}
