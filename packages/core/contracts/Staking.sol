// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/HMTokenInterface.sol';
import './interfaces/IEscrow.sol';
import './interfaces/IStaking.sol';
import './libs/Stakes.sol';

/**
 * @title Staking contract
 * @dev The Staking contract allows to stake.
 */
contract Staking is IStaking, Ownable, ReentrancyGuard {
    using Stakes for Stakes.Staker;

    // Token address
    address public token;

    // Minimum amount of tokens a staker needs to stake
    uint256 public minimumStake;

    // Time in blocks to unstake
    uint32 public lockPeriod;

    // Staker stakes: staker => Stake
    mapping(address => Stakes.Staker) public stakes;

    // List of stakers
    address[] public stakers;

    // Fee percentage
    uint8 public feePercentage;

    // Accumulated fee balance in the contract
    uint256 public feeBalance;

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
     * @dev Emitted when `staker` withdraws `tokens` staked.
     */
    event StakeWithdrawn(address indexed staker, uint256 tokens);

    /**
     * @dev Emitted when `staker` was slashed for a total of `tokens` amount.
     */
    event StakeSlashed(
        address indexed staker,
        uint256 tokens,
        address indexed escrowAddress,
        address slashRequester
    );

    /**
     * @dev Emitted when `owner` withdraws the total `amount` of fees.
     */
    event FeeWithdrawn(uint256 amount);

    constructor(
        address _token,
        uint256 _minimumStake,
        uint32 _lockPeriod,
        uint8 _feePercentage
    ) Ownable(msg.sender) {
        token = _token;
        _setMinimumStake(_minimumStake);
        _setLockPeriod(_lockPeriod);
        _setFeePercentage(_feePercentage);
        slashers[owner()] = true;
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

    function _setMinimumStake(uint256 _minimumStake) private {
        require(_minimumStake > 0, 'Must be a positive number');
        minimumStake = _minimumStake;
    }

    /**
     * @dev Set the lock period for unstaking.
     * @param _lockPeriod Period in blocks to wait for token withdrawals after unstaking
     */
    function setLockPeriod(uint32 _lockPeriod) external override onlyOwner {
        _setLockPeriod(_lockPeriod);
    }

    function _setLockPeriod(uint32 _lockPeriod) private {
        require(_lockPeriod > 0, 'Must be a positive number');
        lockPeriod = _lockPeriod;
    }

    /**
     * @dev Set the fee percentage for slashing.
     * @param _feePercentage Fee percentage for slashing
     */
    function setFeePercentage(uint8 _feePercentage) external onlyOwner {
        _setFeePercentage(_feePercentage);
    }

    function _setFeePercentage(uint8 _feePercentage) private {
        require(_feePercentage <= 100, 'Fee cannot exceed 100%');
        feePercentage = _feePercentage;
    }

    /**
     * @dev Getter that returns if an staker has any available stake.
     * @param _staker Address of the staker
     * @return True if staker has available tokens staked
     */
    function getAvailableStake(
        address _staker
    ) external view override returns (uint256) {
        return stakes[_staker].tokensAvailable();
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
     * @dev Get list of stakers
     * @param _startIndex Index of the first staker to return.
     * @param _limit Maximum number of stakers to return.
     * @return List of staker's addresses, and stake data
     */
    function getListOfStakers(
        uint256 _startIndex,
        uint256 _limit
    ) external view returns (address[] memory, Stakes.Staker[] memory) {
        uint256 _stakersCount = stakers.length;

        require(_startIndex < _stakersCount, 'Start index out of bounds');

        uint256 endIndex = _startIndex + _limit > _stakersCount
            ? _stakersCount
            : _startIndex + _limit;
        address[] memory _stakerAddresses = new address[](
            endIndex - _startIndex
        );
        Stakes.Staker[] memory _stakers = new Stakes.Staker[](
            endIndex - _startIndex
        );

        for (uint256 i = _startIndex; i < endIndex; i++) {
            _stakerAddresses[i - _startIndex] = stakers[i];
            _stakers[i - _startIndex] = stakes[stakers[i]];
        }

        return (_stakerAddresses, _stakers);
    }

    /**
     * @dev Deposit tokens on the staker stake.
     * @param _tokens Amount of tokens to stake
     */
    function stake(uint256 _tokens) external override {
        require(_tokens > 0, 'Must be a positive number');
        Stakes.Staker storage staker = stakes[msg.sender];
        require(
            staker.tokensAvailable() + _tokens >= minimumStake,
            'Total stake is below the minimum threshold'
        );

        if (staker.tokensStaked == 0) {
            stakers.push(msg.sender);
        }

        _safeTransferFrom(token, msg.sender, address(this), _tokens);
        staker.deposit(_tokens);

        emit StakeDeposited(msg.sender, _tokens);
    }

    /**
     * @dev Unstake tokens from the staker stake, lock them until lock period expires.
     * @param _tokens Amount of tokens to unstake
     */
    function unstake(uint256 _tokens) external override nonReentrant {
        require(_tokens > 0, 'Must be a positive number');
        Stakes.Staker storage staker = stakes[msg.sender];
        require(
            staker.tokensLocked == 0 || staker.tokensLockedUntil < block.number,
            'Unstake in progress, complete it first'
        );
        uint256 stakeAvailable = staker.tokensAvailable();
        require(stakeAvailable >= _tokens, 'Insufficient amount to unstake');

        uint256 tokensToWithdraw = staker.tokensWithdrawable();
        if (tokensToWithdraw > 0) {
            _withdraw(msg.sender);
        }

        staker.lockTokens(_tokens, lockPeriod);

        emit StakeLocked(
            msg.sender,
            staker.tokensLocked,
            staker.tokensLockedUntil
        );
    }

    /**
     * @dev Withdraw staker tokens once the lock period has passed.
     */
    function withdraw() external override nonReentrant {
        _withdraw(msg.sender);
    }

    function _withdraw(address _staker) private {
        uint256 tokensToWithdraw = stakes[_staker].withdrawTokens();
        require(
            tokensToWithdraw > 0,
            'Stake has no available tokens for withdrawal'
        );
        _safeTransfer(token, _staker, tokensToWithdraw);

        emit StakeWithdrawn(_staker, tokensToWithdraw);
    }

    /**
     * @dev Slash the staker's stake.
     * @param _staker Address of staker to slash
     * @param _escrowAddress Escrow address
     * @param _tokens Amount of tokens to slash from the staker's stake
     */
    function slash(
        address _slashRequester,
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) external override onlySlasher nonReentrant {
        require(
            _slashRequester != address(0),
            'Must be a valid slash requester address'
        );
        require(_escrowAddress != address(0), 'Must be a valid escrow address');
        Stakes.Staker storage staker = stakes[_staker];
        require(_tokens > 0, 'Must be a positive number');
        require(
            _tokens <= staker.tokensStaked,
            'Slash amount exceeds staked amount'
        );

        uint256 feeAmount = (_tokens * feePercentage) / 100;
        uint256 tokensToSlash = _tokens - feeAmount;

        staker.release(tokensToSlash);
        feeBalance += feeAmount;

        _safeTransfer(token, _slashRequester, tokensToSlash);

        emit StakeSlashed(
            _staker,
            tokensToSlash,
            _escrowAddress,
            _slashRequester
        );
    }

    /**
     * @dev Withdraw the total amount of fees accumulated.
     */
    function withdrawFees() external override onlyOwner nonReentrant {
        require(feeBalance > 0, 'No fees to withdraw');
        uint256 amount = feeBalance;
        feeBalance = 0;

        _safeTransfer(token, msg.sender, amount);

        emit FeeWithdrawn(amount);
    }

    /**
     * @dev Add a new slasher address.
     */
    function addSlasher(address _slasher) external override onlyOwner {
        require(_slasher != address(0), 'Invalid slasher address');
        require(!slashers[_slasher], 'Address is already a slasher');
        slashers[_slasher] = true;
    }

    /**
     * @dev Remove an existing slasher address.
     */
    function removeSlasher(address _slasher) external override onlyOwner {
        require(slashers[_slasher], 'Address is not a slasher');
        delete slashers[_slasher];
    }

    modifier onlySlasher() {
        require(slashers[msg.sender], 'Caller is not a slasher');
        _;
    }

    /**
     * @dev Safe transfer helper
     */
    function _safeTransfer(
        address _token,
        address _to,
        uint256 _value
    ) private {
        SafeERC20.safeTransfer(IERC20(_token), _to, _value);
    }

    /**
     * @dev Safe transferFrom helper
     */
    function _safeTransferFrom(
        address _token,
        address _from,
        address _to,
        uint256 _value
    ) private {
        SafeERC20.safeTransferFrom(IERC20(_token), _from, _to, _value);
    }
}
