// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import './interfaces/HMTokenInterface.sol';
import './interfaces/IEscrow.sol';
import './interfaces/IRewardPool.sol';
import './interfaces/IStaking.sol';
import './libs/Stakes.sol';
import './utils/Math.sol';

/**
 * @title Staking contract
 * @dev The Staking contract allows Operator, Exchange Oracle, Recording Oracle and Reputation Oracle to stake to Escrow.
 */
contract Staking is IStaking {
    using SafeMath for uint256;
    using Stakes for Stakes.Staker;

    // Owner address
    address public owner;

    // ERC20 Token address
    address public eip20;

    // Escrow factory address
    address public escrowFactory;

    // Reward pool address
    address public override rewardPool;

    // Minimum amount of tokens an staker needs to stake
    uint256 public minimumStake;

    // Time in blocks to unstake
    uint32 public lockPeriod;

    // Staker stakes: staker => Stake
    mapping(address => Stakes.Staker) public stakes;

    // List of stakers per role
    mapping(Stakes.Role => address[]) public stakers;

    // Allocations : escrowAddress => Allocation
    mapping(address => IStaking.Allocation) public allocations;

    // List of addresses allowed to slash stakes
    mapping(address => bool) public slashers;

    /**
     * @dev Emitted when `staker` stake `tokens` amount.
     */
    event StakeDeposited(address indexed staker, uint256 tokens);

    /**
     * @dev Emitted when `staker` unstaked and locked `tokens` amount `until` block.
     */
    event StakeLocked(address indexed staker, uint256 tokens, uint256 until);

    /**
     * @dev Emitted when `staker` withdrew `tokens` staked.
     */
    event StakeWithdrawn(address indexed staker, uint256 tokens);

    /**
     * @dev Emitted when `staker` was slashed for a total of `tokens` amount.
     */
    event StakeSlashed(address indexed staker, uint256 tokens);

    /**
     * @dev Emitted when `staker` allocated `tokens` amount to `escrowAddress`.
     */
    event StakeAllocated(
        address indexed staker,
        uint256 tokens,
        address indexed escrowAddress,
        uint256 createdAt
    );

    /**
     * @dev Emitted when `staker` close an allocation `escrowAddress`.
     */
    event AllocationClosed(
        address indexed staker,
        uint256 tokens,
        address indexed escrowAddress,
        uint256 closedAt
    );

    /**
     * @dev Emitted when `owner` set new value for `minimumStake`.
     */
    event SetMinumumStake(uint256 indexed minimumStake);

    /**
     * @dev Emitted when `owner` set new value for `lockPeriod`.
     */
    event SetLockPeriod(uint32 indexed lockPeriod);

    /**
     * @dev Emitted when `owner` set new value for `rewardPool`.
     */
    event SetRewardPool(address indexed rewardPool);

    /**
     * @dev Emitted when `owner` set address as `staker` with `role`.
     */
    event SetStaker(address indexed staker, Stakes.Role indexed role);

    constructor(
        address _eip20,
        address _escrowFactory,
        uint256 _minimumStake,
        uint32 _lockPeriod
    ) {
        eip20 = _eip20;
        escrowFactory = _escrowFactory;
        owner = msg.sender;
        _setMinimumStake(_minimumStake);
        _setLockPeriod(_lockPeriod);
    }

    /**
     * @dev Set the minimum stake amount.
     * @param _minimumStake Minimum stake
     */
    function setMinimumStake(
        uint256 _minimumStake
    ) external override onlyOwner {
        _setMinimumStake(_minimumStake);
    }

    /**
     * @dev Set the minimum stake amount.
     * @param _minimumStake Minimum stake
     */
    function _setMinimumStake(uint256 _minimumStake) private {
        require(_minimumStake > 0, 'Must be a positive number');
        minimumStake = _minimumStake;
        emit SetMinumumStake(minimumStake);
    }

    /**
     * @dev Set the lock period for unstaking.
     * @param _lockPeriod Period in blocks to wait for token withdrawals after unstaking
     */
    function setLockPeriod(uint32 _lockPeriod) external override onlyOwner {
        _setLockPeriod(_lockPeriod);
    }

    /**
     * @dev Set the lock period for unstaking.
     * @param _lockPeriod Period in blocks to wait for token withdrawals after unstaking
     */
    function _setLockPeriod(uint32 _lockPeriod) private {
        require(_lockPeriod > 0, 'Must be a positive number');
        lockPeriod = _lockPeriod;
        emit SetLockPeriod(lockPeriod);
    }

    /**
     * @dev Set the destionations of the rewards.
     * @param _rewardPool Reward pool address
     */
    function setRewardPool(address _rewardPool) external override onlyOwner {
        _setRewardPool(_rewardPool);
    }

    /**
     * @dev Set the destionations of the rewards.
     * @param _rewardPool Reward pool address
     */
    function _setRewardPool(address _rewardPool) private {
        require(_rewardPool != address(0), 'Must be a valid address');
        rewardPool = _rewardPool;
        emit SetRewardPool(_rewardPool);
    }

    /**
     * @dev Add address to the list of stakers.
     * @param _staker Staker's address
     * @param _role Role of the staker
     */
    function setStaker(address _staker, Stakes.Role _role) external onlyOwner {
        require(_staker != address(0), 'Must be a valid address');
        require(_staker != msg.sender, 'Staker cannot set himself');

        Stakes.Staker memory staker = Stakes.Staker(_role, 0, 0, 0, 0);

        stakes[_staker] = staker;
        stakers[_role].push(_staker);
        emit SetStaker(_staker, _role);
    }

    /**
     * @dev Return the result of checking if the staker has a specific role.
     * @param _staker Staker's address
     * @param _role Role of the staker
     * @return True if _staker has role
     */
    function isRole(
        address _staker,
        Stakes.Role _role
    ) external view returns (bool) {
        Stakes.Staker memory staker = stakes[_staker];
        return staker.role == _role;
    }

    /**
     * @dev Return if escrowAddress is use for allocation.
     * @param _escrowAddress Address used as signer by the staker for an allocation
     * @return True if _escrowAddress already used
     */
    function isAllocation(
        address _escrowAddress
    ) external view override returns (bool) {
        return _getAllocationState(_escrowAddress) != AllocationState.Null;
    }

    /**
     * @dev Getter that returns if an staker has any stake.
     * @param _staker Address of the staker
     * @return True if staker has staked tokens
     */
    function hasStake(address _staker) external view override returns (bool) {
        return stakes[_staker].tokensStaked > 0;
    }

    /**
     * @dev Getter that returns if an staker has any available stake.
     * @param _staker Address of the staker
     * @return True if staker has available tokens staked
     */
    function hasAvailableStake(
        address _staker
    ) external view override returns (bool) {
        return stakes[_staker].tokensAvailable() > 0;
    }

    /**
     * @dev Return the allocation by escrow address.
     * @param _escrowAddress Address used as allocation identifier
     * @return Allocation data
     */
    function getAllocation(
        address _escrowAddress
    ) external view override returns (Allocation memory) {
        return _getAllocation(_escrowAddress);
    }

    /**
     * @dev Return the allocation by job ID.
     * @param _escrowAddress Address used as allocation identifier
     * @return Allocation data
     */
    function _getAllocation(
        address _escrowAddress
    ) private view returns (Allocation memory) {
        return allocations[_escrowAddress];
    }

    /**
     * @dev Return the current state of an allocation.
     * @param _escrowAddress Address used as the allocation identifier
     * @return AllocationState
     */
    function getAllocationState(
        address _escrowAddress
    ) external view override returns (AllocationState) {
        return _getAllocationState(_escrowAddress);
    }

    /**
     * @dev Return the current state of an allocation, partially depends on job status
     * @param _escrowAddress Job identifier (Escrow address)
     * @return AllocationState
     */
    function _getAllocationState(
        address _escrowAddress
    ) private view returns (AllocationState) {
        Allocation storage allocation = allocations[_escrowAddress];

        if (allocation.staker == address(0)) {
            return AllocationState.Null;
        }

        IEscrow escrow = IEscrow(_escrowAddress);
        IEscrow.EscrowStatuses escrowStatus = escrow.getStatus();

        if (
            allocation.createdAt != 0 &&
            allocation.tokens > 0 &&
            escrowStatus == IEscrow.EscrowStatuses.Pending
        ) {
            return AllocationState.Pending;
        }

        if (
            allocation.closedAt == 0 &&
            escrowStatus == IEscrow.EscrowStatuses.Launched
        ) {
            return AllocationState.Active;
        }

        if (
            allocation.closedAt > 0 &&
            escrowStatus == IEscrow.EscrowStatuses.Complete
        ) {
            return AllocationState.Completed;
        }

        return AllocationState.Closed;
    }

    /**
     * @dev Get the total amount of tokens staked by the staker.
     * @param _staker Address of the staker
     * @return Amount of tokens staked by the staker
     */
    function getStakedTokens(
        address _staker
    ) external view override returns (uint256) {
        return stakes[_staker].tokensStaked;
    }

    /**
     * @dev Get staker data by the staker address.
     * @param _staker Address of the staker
     * @return Staker's data
     */
    function getStaker(
        address _staker
    ) external view returns (Stakes.Staker memory) {
        return stakes[_staker];
    }

    /**
     * @dev Get list of stakers per role
     * @param _role Staker role
     * @return List of staker's addresses, and stake data
     */
    function getListOfStakers(
        Stakes.Role _role
    )
        external
        view
        override
        returns (address[] memory, Stakes.Staker[] memory)
    {
        address[] memory _stakerAddresses = stakers[_role];
        uint256 _stakersCount = _stakerAddresses.length;

        if (_stakersCount == 0) {
            return (new address[](0), new Stakes.Staker[](0));
        }

        Stakes.Staker[] memory _stakers = new Stakes.Staker[](_stakersCount);

        for (uint256 _i = 0; _i < _stakersCount; _i++) {
            _stakers[_i] = stakes[_stakerAddresses[_i]];
        }

        return (_stakerAddresses, _stakers);
    }

    /**
     * @dev Deposit tokens on the staker stake.
     * @param _tokens Amount of tokens to stake
     */
    function stake(uint256 _tokens) external override onlyStaker(msg.sender) {
        require(_tokens > 0, 'Must be a positive number');
        require(
            stakes[msg.sender].tokensSecureStake().add(_tokens) >= minimumStake,
            'Total stake is below the minimum threshold'
        );

        HMTokenInterface token = HMTokenInterface(eip20);
        token.transferFrom(msg.sender, address(this), _tokens);

        stakes[msg.sender].deposit(_tokens);

        emit StakeDeposited(msg.sender, _tokens);
    }

    /**
     * @dev Unstake tokens from the staker stake, lock them until lock period expires.
     * @param _tokens Amount of tokens to unstake
     */
    function unstake(uint256 _tokens) external override onlyStaker(msg.sender) {
        Stakes.Staker storage staker = stakes[msg.sender];

        require(staker.tokensStaked > 0, 'Must be a positive number');

        uint256 tokensToLock = Math.min(staker.tokensAvailable(), _tokens);
        require(tokensToLock > 0, 'Must be a positive number');

        uint256 newStake = staker.tokensSecureStake().sub(tokensToLock);
        require(
            newStake == 0 || newStake >= minimumStake,
            'Total stake is below the minimum threshold'
        );

        uint256 tokensToWithdraw = staker.tokensWithdrawable();
        if (tokensToWithdraw > 0) {
            _withdraw(msg.sender);
        }

        staker.lockTokens(tokensToLock, lockPeriod);

        emit StakeLocked(
            msg.sender,
            staker.tokensLocked,
            staker.tokensLockedUntil
        );
    }

    /**
     * @dev Withdraw staker tokens based on the locking period.
     */
    function withdraw() external override onlyStaker(msg.sender) {
        _withdraw(msg.sender);
    }

    /**
     * @dev Withdraw staker tokens once the lock period has passed.
     * @param _staker Address of staker to withdraw funds from
     */
    function _withdraw(address _staker) private {
        uint256 tokensToWithdraw = stakes[_staker].withdrawTokens();
        require(
            tokensToWithdraw > 0,
            'Stake has no available tokens for withdrawal'
        );

        HMTokenInterface token = HMTokenInterface(eip20);
        token.transfer(_staker, tokensToWithdraw);

        emit StakeWithdrawn(_staker, tokensToWithdraw);
    }

    /**
     * @dev Slash the staker stake allocated to the escrow.
     * @param _staker Address of staker to slash
     * @param _escrowAddress Escrow address
     * @param _tokens Amount of tokens to slash from the indexer stake
     */
    function slash(
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) external override onlyValidator(msg.sender) {
        require(_escrowAddress != address(0), 'Must be a valid address');

        Stakes.Staker storage staker = stakes[_staker];

        Allocation storage allocation = allocations[_escrowAddress];

        require(allocation.tokens > 0, 'Must be a positive number');

        require(
            _tokens <= allocation.tokens,
            'Slash tokens exceed allocated ones'
        );

        staker.unallocate(_tokens);
        allocation.tokens = allocation.tokens.sub(_tokens);

        staker.release(_tokens);

        HMTokenInterface token = HMTokenInterface(eip20);
        token.transfer(rewardPool, _tokens);

        // Keep record on Reward Pool
        IRewardPool(rewardPool).addReward(_escrowAddress, msg.sender, _tokens);

        emit StakeSlashed(msg.sender, _tokens);
    }

    /**
     * @dev Allocate available tokens to an escrow.
     * @param _escrowAddress The allocationID will work to identify collected funds related to this allocation
     * @param _tokens Amount of tokens to allocate
     */
    function allocate(
        address _escrowAddress,
        uint256 _tokens
    ) external override onlyStaker(msg.sender) {
        _allocate(msg.sender, _escrowAddress, _tokens);
    }

    /**
     * @dev Allocate available tokens to an escrow.
     * @param _staker Staker address to allocate funds from.
     * @param _escrowAddress The escrow address which collected funds related to this allocation
     * @param _tokens Amount of tokens to allocate
     */
    function _allocate(
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) private {
        require(_escrowAddress != address(0), 'Must be a valid address');
        require(
            stakes[msg.sender].tokensAvailable() >= _tokens,
            'Insufficient amount of tokens in the stake'
        );
        require(_tokens > 0, 'Must be a positive number');
        require(
            _getAllocationState(_escrowAddress) == AllocationState.Null,
            'Allocation already exists'
        );

        Allocation memory allocation = Allocation(
            _escrowAddress, // Escrow address
            _staker, // Staker address
            _tokens, // Tokens allocated
            block.number, // createdAt
            0 // closedAt
        );

        allocations[_escrowAddress] = allocation;
        stakes[_staker].allocate(allocation.tokens);

        emit StakeAllocated(
            _staker,
            allocation.tokens,
            _escrowAddress,
            allocation.createdAt
        );
    }

    /**
     * @dev Close an allocation and free the staked tokens.
     * @param _escrowAddress The allocation identifier
     */
    function closeAllocation(
        address _escrowAddress
    ) external override onlyStaker(msg.sender) {
        _closeAllocation(_escrowAddress);
    }

    /**
     * @dev Close an allocation and free the staked tokens.
     * @param _escrowAddress The allocation identifier
     */
    function _closeAllocation(address _escrowAddress) private {
        AllocationState allocationState = _getAllocationState(_escrowAddress);
        require(
            allocationState == AllocationState.Completed,
            'Allocation has no completed state'
        );

        Allocation memory allocation = allocations[_escrowAddress];

        allocation.closedAt = block.number;
        uint256 diffInBlocks = Math.diffOrZero(
            allocation.closedAt,
            allocation.createdAt
        );
        require(diffInBlocks > 0, 'Allocation cannot be closed so early');

        stakes[allocation.staker].unallocate(allocation.tokens);

        emit AllocationClosed(
            allocation.staker,
            allocation.tokens,
            _escrowAddress,
            allocation.closedAt
        );
    }

    modifier onlyOwner() {
        require(owner == msg.sender, 'Caller is not a owner');
        _;
    }

    modifier onlyStaker(address _staker) {
        Stakes.Staker memory staker = stakes[_staker];
        require(
            staker.role == Stakes.Role.Operator ||
                staker.role == Stakes.Role.Validator ||
                staker.role == Stakes.Role.ExchangeOracle ||
                staker.role == Stakes.Role.ReputationOracle ||
                staker.role == Stakes.Role.RecordingOracle,
            'Caller is not a staker'
        );
        _;
    }

    modifier onlyOperator(address _staker) {
        Stakes.Staker memory staker = stakes[_staker];
        require(
            staker.role == Stakes.Role.Operator,
            'Caller is not a operator'
        );
        _;
    }

    modifier onlyValidator(address _staker) {
        Stakes.Staker memory staker = stakes[_staker];
        require(
            staker.role == Stakes.Role.Validator,
            'Caller is not a validator'
        );
        _;
    }
}
