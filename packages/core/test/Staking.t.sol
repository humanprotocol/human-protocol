pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/RewardPool.sol";
import "../src/EscrowFactory.sol";
import "../src/Escrow.sol";
import "./CoreUtils2.t.sol";
import "./CoreUtils.t.sol";

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

    string MOCK_URL = "http://google.com/fake";
    string MOCK_HASH = "kGKmnj9BRf";

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');
        // Loop through accounts and approve HMToken for each account
        for (uint256 i = 0; i < accounts.length - 1; i++) {
            hmToken.approve(accounts[i + 1], 1000);
            hmToken.transfer(accounts[i + 1], 1000);
        }

        // Deploy Staking Proxy
        address stakingImpl = address(new Staking());
        bytes memory stakingData =
            abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), minimumStake, lockPeriod);
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
        vm.prank(accounts[1]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[2]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[3]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[4]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[5]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[6]);
        hmToken.approve(address(staking), 1000);
        vm.prank(accounts[7]);
        hmToken.approve(address(staking), 1000);
    }

    function testInitValidations() public {
        assertEq(staking.token(), address(hmToken), "Should set the right token address");
        assertEq(staking.minimumStake(), 2, "Should set the right minimum stake");
        assertEq(staking.lockPeriod(), 2, "Should set the right lock period");
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

    function testFail_AllocateNotValidAddress() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        vm.expectRevert("MUST_BE_VALID_ADDRESS");
        uint256 allocationAmount = 5;
        staking.allocate(address(0), allocationAmount);
        vm.stopPrank();
    }

    function testFail_AllocateInsufficientAmountStaked() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        uint256 allocationAmount = 20;
        vm.expectRevert("INSUFFICIENT_AMOUNT_STAKED");
        staking.allocate(escrowAddress, allocationAmount);
        vm.stopPrank();
    }

    function testFail_AllocateNotPositiveNumber() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        uint256 allocationAmount = 0;
        vm.expectRevert("MUST_BE_POSITIVE_NUMBER");
        staking.allocate(escrowAddress, allocationAmount);
        vm.stopPrank();
    }

    function testFail_AllocationAlreadyExists() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        uint256 allocationAmount = 3;
        staking.allocate(escrowAddress, allocationAmount);
        vm.expectRevert("ALLOCATION_ALREADY_EXISTS");
        staking.allocate(escrowAddress, allocationAmount);
    }

    function testEmitEventOnStakeAllocated() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        uint256 allocationAmount = 5;
        vm.expectEmit();
        emit StakeAllocated(operator, allocationAmount, escrowAddress, block.number);
        staking.allocate(escrowAddress, allocationAmount);
        vm.stopPrank();
    }

    function testAllocateTokensToAllocation() public {
        vm.startPrank(operator);
        uint256 amount = 10;
        staking.stake(amount);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        uint256 allocationAmount = 5;
        staking.allocate(escrowAddress, allocationAmount);
        IStaking.Allocation memory allocation = staking.getAllocation(escrowAddress);
        assertEq(allocation.escrowAddress, escrowAddress);
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
        uint256 lockedTokens = 5;
        uint256 stakeTokens = 10;
        address[] memory trustedHandlers = _initTrustedHandlers();

        staking.stake(stakeTokens);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), _initTrustedHandlers(), jobRequesterId);
        staking.unstake(lockedTokens);
        Stakes.Staker memory staker = staking.getStaker(operator);
        uint256 latestBlockNumber = block.number;
        assertLt(latestBlockNumber, staker.tokensLockedUntil);
    }

    function testFail_SetMinimumStakeCallerNotOwner() public {
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

    function testSlashTOkensFromStakeAndTransferToRewardPool() public {
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

        vm.prank(owner);
        staking.slash(validator[0], operator, escrowAddress, slashedTokens);
        vm.startPrank(operator);
        IStaking.Allocation memory allocation = staking.getAllocation(escrowAddress);
        assertEq(allocation.tokens, allocatedTokens - slashedTokens);
        Stakes.Staker memory stakerAfterSlash = staking.getStaker(operator);
        assertEq(stakerAfterSlash.tokensStaked, (stakedTokens - slashedTokens));
        assertEq(hmToken.balanceOf(address(rewardPool)), slashedTokens);
    }

    function testReturnListOfStakers() public {
        uint256 stakedTokens = 2;
        for (uint8 i = 2; i < 8; i++) {
            vm.prank(accounts[i]);
            staking.stake(stakedTokens * (i + 1));
        }

        (address[] memory stakers, Stakes.Staker[] memory stakes) = staking.getListOfStakers();

        assertEq(stakers.length, 6);
        assertEq(stakes.length, 6);

        for (uint8 i = 0; i < 6; i++) {
            assertEq(stakers[i], accounts[i + 2]);
            assertEq(stakes[i].tokensStaked, stakedTokens * (i + 3));
        }
    }

    function testFail_CloseAllocationNotValidAddress() public {
        uint256 amount = 10;
        uint256 allocationAmount = 5;
        vm.startPrank(accounts[2]);
        staking.stake(amount);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        // create escrow
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        vm.stopPrank();
        vm.prank(owner);
        // Fund escrow
        hmToken.transfer(escrowAddress, 100);
        // Setup escrow
        vm.startPrank(accounts[2]);
        Escrow escrow = Escrow(escrowAddress);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        staking.allocate(escrowAddress, allocationAmount);
        vm.expectRevert("MUST_BE_VALID_ADDRESS");
        staking.closeAllocation(address(0));
        vm.stopPrank();
    }

    function testFail_CloseAllocationCallerNotAllocator() public {
        uint256 amount = 10;
        uint256 allocationAmount = 5;
        vm.startPrank(accounts[2]);
        staking.stake(amount);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        // create escrow
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        vm.stopPrank();
        vm.prank(owner);
        // Fund escrow
        hmToken.transfer(escrowAddress, 100);
        vm.prank(accounts[2]);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        staking.allocate(escrowAddress, allocationAmount);
        vm.prank(accounts[1]);
        vm.expectRevert("CALLER_IS_NOT_THE_ALLOCATOR");
        staking.closeAllocation(escrowAddress);
    }

    function testFail_CloseAllocationRevertsEscrowNotCompletedNorCancelled() public {
        uint256 amount = 10;
        uint256 allocationAmount = 5;
        vm.startPrank(accounts[2]);
        staking.stake(amount);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        // create escrow
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        vm.stopPrank();
        vm.prank(owner);
        // Fund escrow
        hmToken.transfer(escrowAddress, 100);
        vm.startPrank(accounts[2]);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        staking.allocate(escrowAddress, allocationAmount);
        vm.expectRevert("ALLOCATION_NOT_IN_COMPLETED_STATE");
        staking.closeAllocation(escrowAddress);
        vm.stopPrank();
    }

    function testCloseAllocationOnCompletedEscrows() public {
        uint256 amount = 10;
        uint256 allocationAmount = 5;

        vm.startPrank(accounts[2]);
        // stake tokens and create escrow
        staking.stake(amount);
        address[] memory escrowParams = new address[](3);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        vm.stopPrank();

        // Fund escrow
        vm.prank(owner);
        hmToken.transfer(escrowAddress, 100);

        // Setup escrow
        vm.startPrank(accounts[2]);
        escrow.setup(accounts[6], accounts[7], accounts[5], 10, 10, 10, MOCK_URL, MOCK_HASH);
        staking.allocate(escrowAddress, allocationAmount);
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = 100;
        address[] memory operator2 = new address[](1);
        operator2[0] = vm.addr(1212);
        escrow.bulkPayOut(operator2, _amounts, MOCK_URL, MOCK_HASH, 0);
        escrow.complete();

        //Close allocation
        vm.roll(4);
        staking.closeAllocation(escrowAddress);
        IStaking.Allocation memory allocation = staking.getAllocation(escrowAddress);
        assertGt(allocation.closedAt, 0);
        assertEq(allocation.tokens, 0);

        vm.stopPrank();
    }

    function testEmitEventOnAllocationClosed() public {
        uint256 amount = 10;
        uint256 allocationAmount = 5;

        vm.startPrank(accounts[2]);
        // stake tokens and create escrow
        staking.stake(amount);
        address[] memory escrowParams = new address[](3);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), trustedHandlers, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        vm.stopPrank();

        // Fund escrow
        vm.prank(owner);
        hmToken.transfer(escrowAddress, 100);

        // Setup escrow
        vm.startPrank(accounts[2]);
        escrow.setup(accounts[6], accounts[7], accounts[5], 10, 10, 10, MOCK_URL, MOCK_HASH);
        staking.allocate(escrowAddress, allocationAmount);
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = 100;
        address[] memory operator2 = new address[](1);
        operator2[0] = vm.addr(1212);
        escrow.bulkPayOut(operator2, _amounts, MOCK_URL, MOCK_HASH, 0);
        escrow.complete();

        //Close allocation
        vm.roll(4);
        IStaking.Allocation memory allocation = staking.getAllocation(escrowAddress);
        vm.expectEmit();
        emit AllocationClosed(allocation.staker, allocation.tokens, escrowAddress, block.number);
        staking.closeAllocation(escrowAddress);
        vm.stopPrank();
    }
}
