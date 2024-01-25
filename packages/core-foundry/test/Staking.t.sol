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
    EscrowFactory public escrowFactory;
    Escrow public escrow;
    RewardPool public rewardPool;

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');
        // Loop through accounts and approve HMToken for each account
        for (uint256 i = 0; i < accounts.length - 1; i++) {
            hmToken.approve(accounts[i+1], 1000);
            hmToken.transfer(accounts[i+1], 1000);
        }

        // Deploy Staking Proxy
        address stakingImpl = address(new Staking());
        bytes memory stakingData = abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), minimumStake, lockPeriod);
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
            abi.encodeWithSelector(RewardPool.initialize.selector, address(hmToken), address(staking), rewardFee);
        address rewardPoolProxy = address(new ERC1967Proxy(rewardPoolImpl, rewardPoolData));
        rewardPool = RewardPool(rewardPoolProxy);

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

    function testEmitEventOnStakeWithdrawal() public {
        vm.startPrank(operator);
        uint256 lockedTokens = 5;
        uint256 stakeTokens = 10;
        address[] memory trustedHandlers = _initTrustedHandlers();

        // Stake to be able to create escrow 
        staking.stake(stakeTokens);

        // Create escrow 
        escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);

        // Unstake to lock tokens for withdrawal
        staking.unstake(lockedTokens);
        // Pass the LockPeriod 
        vm.roll(3);
        staking.stake(stakeTokens);
        vm.expectEmit(true, false, false, true);
        emit StakeWithdrawn(operator, lockedTokens);
        staking.withdraw();
        vm.stopPrank();
    }

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

    function testFail_CallerNotOwner() public {
        uint256 minimumStake = 0;
        vm.prank(operator);
        vm.expectRevert("OWNABLE: CALLER_IS_NOT_THE_OWNER");
        staking.setMinimumStake(minimumStake);
    }

    function testFail_NotPositiveNumberOnSetLockPeriod() public {
        uint256 minimumStake = 0;
        vm.prank(owner);
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.setMinimumStake(minimumStake);
    }

    function testEmitEventOnStakeLocked() public {
        uint256 minimumStake = 5;
        vm.prank(owner);
        vm.expectEmit();
        emit SetMinumumStake(minimumStake);
        staking.setMinimumStake(minimumStake);
    }

    function testAssignValueToMinimumStake() public {
        uint256 minimumStake = 5;
        vm.prank(owner);
        staking.setMinimumStake(minimumStake);
        assertEq(staking.minimumStake(), minimumStake);
    }

    function testFail_CallerNotOwnerForSetLockPeriod() public {
        uint32 lockPeriod = 0;
        vm.prank(operator);
        vm.expectRevert("OWNABLE: CALLER_IS_NOT_THE_OWNER");
        staking.setLockPeriod(lockPeriod);
    }

    function testFail_NotPositiveNumber() public {
        uint32 lockPeriod = 0;
        vm.prank(owner);
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.setLockPeriod(lockPeriod);
    }

    function testEmitEventOnStakeLockedWith5() public {
        uint32 lockPeriod = 5;
        vm.prank(owner);
        vm.expectEmit();
        emit SetLockPeriod(lockPeriod);
        staking.setLockPeriod(lockPeriod);
    }

    function testAssignValueToMinimumStakeValue() public {
        uint32 lockPeriod = 5;
        vm.prank(owner);
        staking.setLockPeriod(lockPeriod);
        assertEq(staking.lockPeriod(), lockPeriod);
    }

    function testFail_CallerNotOwnerForSetRewardPool() public {
        vm.prank(operator);
        vm.expectRevert("OWNABLE: CALLER_IS_NOT_THE_OWNER");
        staking.setRewardPool(address(rewardPool));
    }

    function testFail_NotPositiveNumberSetRewardPool() public {
        vm.prank(owner);
        vm.expectRevert("MUST_BE_VALID_ADDRESS");
        staking.setRewardPool(address(0));
    }

    function testAssignValueToMinStakeVariable() public {
        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        assertEq(staking.rewardPool(), address(rewardPool));
    }

    function testEscrowHasNoAllocation() public {
        uint256 stakedTokens = 10;
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        vm.stopPrank();
        vm.prank(owner);
        assertEq(staking.isAllocation(escrowAddress), false);
    }

    function testEscrowHasAllocation() public {
        uint256 stakedTokens = 10;
        vm.prank(operator);
        staking.stake(stakedTokens);
        vm.prank(owner);
        bool result = staking.hasStake(operator);
        assertEq(result, true, "Should stake token");
    }

    function testNullAllocationByEscrow() public {
        uint256 allocationTokens = 10;
        uint256 stakedTokens = 10;
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocationTokens);
        IStaking.Allocation memory allocation = staking.getAllocation(address(0));
        assertEq(allocation.escrowAddress, address(0));
        assertEq(allocation.staker, address(0));
        assertEq(allocation.tokens, 0);
        assertEq(allocation.createdAt, 0);
        assertEq(allocation.closedAt, 0);
    }

    function testAllocationByEscrowAddress() public {
        uint256 allocationTokens = 10;
        uint256 stakedTokens = 10;
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocationTokens);
        IStaking.Allocation memory allocation = staking.getAllocation(escrowAddress);
        assertEq(allocation.escrowAddress, escrowAddress);
        assertEq(allocation.staker, operator);
        assertEq(allocation.tokens, allocationTokens);
    }

    function testFail_SlashRevertsCallerNotOwner() public {
        uint256 stakedTokens = 10;
        uint256 allocatedTokens = 5;
        uint256 slashedTokens = 2;
        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        vm.prank(validator);
        staking.stake(stakedTokens);
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocatedTokens);
        vm.expectRevert("OWNABLE: CALLER_IS_NOT_THE_OWNER");
        staking.slash(operator, operator, escrowAddress, slashedTokens);
    }

    function testFail_SlashRevertsInvalidAddress() public {
        uint256 stakedTokens = 10;
        uint256 allocatedTokens = 5;
        uint256 slashedTokens = 2;
        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        vm.prank(validator);
        staking.stake(stakedTokens);
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        vm.expectRevert("MUST_BE_VALID_ADDRESS");
        staking.slash(validator, operator, address(0), slashedTokens);
    }

    function testFail_RevertsSlashAmountExceedsAllocation() public {
        uint256 stakedTokens = 10;
        uint256 allocatedTokens = 5;
        uint256 slashedTokens = 2;
        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        vm.prank(validator);
        staking.stake(stakedTokens);
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocatedTokens);
        vm.stopPrank();
        vm.prank(owner);
        vm.expectRevert("SLASH_TOKENS_EXCEEDS_ALLOCATED_ONES");
        staking.slash(validator[0], operator, escrowAddress, slashedTokens);
    }

    function testFail_SlashAmountIsZero() public {
        uint256 stakedTokens = 10;
        uint256 allocatedTokens = 5;
        uint256 slashedTokens = 2;
        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        vm.prank(validator);
        staking.stake(stakedTokens);
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        address[] memory validator = new address[](1);
        validator[0] = accounts[1];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocatedTokens);
        vm.stopPrank();
        vm.prank(owner);
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.slash(validator[0], operator, escrowAddress, 0);
    }

    function testEmitOnStakeSlashed() public {
        uint256 stakedTokens = 10;
        uint256 allocatedTokens = 5;
        uint256 slashedTokens = 2;

        address[] memory validator = new address[](1);
        validator[0] = accounts[1];


        vm.prank(owner);
        staking.setRewardPool(address(rewardPool));
        vm.prank(validator[0]);
        staking.stake(stakedTokens);
        vm.startPrank(operator);
        staking.stake(stakedTokens);
        
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), validator, jobRequesterId);
        staking.allocate(escrowAddress, allocatedTokens);
        vm.stopPrank();
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit StakeSlashed(operator, slashedTokens, escrowAddress, validator[0]);
        staking.slash(validator[0], operator, escrowAddress, slashedTokens);
        vm.stopPrank();
    }

    function testAllocationByEscrow() public {}
}
