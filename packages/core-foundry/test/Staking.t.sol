pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/RewardPool.sol";
import "../src/EscrowFactory.sol";
import "../src/Escrow.sol";
import "./CoreUtils2.t.sol";

interface EscrowFactoryEvents {
    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);
}

interface StakingEvents {
    event StakeDeposited(address indexed staker, uint256 tokens);
    event StakeLocked(address indexed staker, uint256 tokens, uint256 until);
    event StakeWithdrawn(address indexed staker, uint256 tokens);
    event StakeSlashed(address indexed staker, uint256 tokens, address indexed escrowAddress, address slasher);
    event StakeAllocated(address indexed staker, uint256 tokens, address indexed escrowAddress, uint256 createdAt);
    event AllocationClosed(address indexed staker, uint256 tokens, address indexed escrowAddress, uint256 closedAt);
    event SetMinumumStake(uint256 indexed minimumStake);
    event SetLockPeriod(uint32 indexed lockPeriod);
    event SetRewardPool(address indexed rewardPool);
}

contract StakingTest is CoreUtils2, StakingEvents, EscrowFactoryEvents {
    Staking public staking;
    HMToken public hmToken;
    RewardPool public rewardPool;
    EscrowFactory public escrowFactory;
    Escrow public escrow;

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');
        // Loop through accounts and approve HMToken for each account
        for (uint256 i = 0; i < accounts.length; i++) {
            hmToken.approve(accounts[i], 1000);
            hmToken.transfer(accounts[i], 1000);
        }

        // Deploy Staking Proxy
        address stakingImpl = address(new Staking());
        bytes memory stakingData = abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), 2, 1);
        address stakingProxy = address(new ERC1967Proxy(stakingImpl, stakingData));
        staking = Staking(stakingProxy);

        //Deploy Escrow Factory proxy
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
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

        vm.stopPrank();

        // Approve spend HMT tokens staking contract
        vm.prank(validator);
        hmToken.approve(address(staking), 1000);
        vm.prank(operator);
        hmToken.approve(address(staking), 1000);
        vm.prank(operator2);
        hmToken.approve(address(staking), 1000);
        vm.prank(operator3);
        hmToken.approve(address(staking), 1000);
        vm.prank(exchangeOracle);
        hmToken.approve(address(staking), 1000);
        vm.prank(reputationOracle);
        hmToken.approve(address(staking), 1000);
        vm.prank(recordingOracle);
        hmToken.approve(address(staking), 1000);
    }

    function testInitValidations() public {
        assertEq(staking.token(), address(hmToken), "Should set the right token address");
        assertEq(staking.minimumStake(), 2, "Should set the right minimum stake");
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

    function testEventDeposited() public {
        vm.startPrank(operator);
        hmToken.approve(address(staking), 100);
        vm.expectEmit();
        emit StakeDeposited(operator, 2);
        staking.stake(2);
        vm.stopPrank();
    }

    function testIncreaseStake() public {
        vm.startPrank(operator);
        staking.stake(2);
        bool result = staking.hasStake(operator);
        assertEq(result, true, "Should stake token and increase staker stake");
    }

    function testFail_UnstakeNotPositiveNumber() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.unstake(0);
    }

    function testFail_UnstakeHigherThanStake() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        vm.expectRevert("INSUFFICIENT_AMOUNT_TO_UNSTAKE");
        staking.unstake(15);
    }

    function testFail_TotalStakeBelowMinThreshold() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        vm.expectRevert("TOTAL_STAKE_BELOW_MINIMUM_THRESHOLD");
        staking.unstake(9);
    }

    function testStakeLocked() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        vm.expectEmit();
        uint256 untilLocked = staking.lockPeriod() + 1;
        emit StakeLocked(operator, 5, untilLocked);
        staking.unstake(5);
    }

    function testLockTokensForWithdrawal() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        staking.unstake(5);
        Stakes.Staker memory staker = staking.getStaker(operator);
        uint256 untilLocked = staking.lockPeriod() + 1;
        assertEq(staker.tokensLocked, 5, "Should lock tokens for withdrawal");
        assertEq(staker.tokensLockedUntil, untilLocked);
    }

    function testFail_WithdrawalWitoutAllocation() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address[] memory trustedHandlers = _initTrustedHandlers();
        escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        vm.expectRevert("STAKE_HAS_NO_AVAILABLE_TOKENS_FOR_WITHDRAWAL");
        staking.withdraw();
    }

    // function testEmitEventOnStakeWithdrawal() public {
    //     vm.startPrank(operator);
    //     uint256 amount = 10;
    //     uint256 lockedTokens = 5;
    //     staking.stake(amount);
    //     address[] memory trustedHandlers = _initTrustedHandlers();
    //     escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
    //     staking.unstake(lockedTokens);
    //     vm.expectEmit();
    //     emit StakeWithdrawn(operator, lockedTokens);
    //     staking.withdraw();
    //     vm.stopPrank();
    // }

    function testDecreaseAmountOfTokensStaked() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        uint256 lockedTokens = 5;
        staking.stake(amount);
        staking.unstake(lockedTokens);
        Stakes.Staker memory staker = staking.getStaker(operator);
        uint256 latestBlockNumber = vm.getBlockNumber();
        console.log(latestBlockNumber);
    }
}
