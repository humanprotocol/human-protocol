// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/HMTokenInterface.sol';
import './interfaces/IEscrow.sol';
import './interfaces/IStaking.sol';
import './libs/Stakes.sol';
import './utils/Math.sol';

/**
 * @title Staking contract
 * @dev The Staking contract allows Operator, Exchange Oracle, Recording Oracle and Reputation Oracle to stake to Escrow.
 */
contract Staking is IStaking, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMath for uint256;
    using Stakes for Stakes.Staker;

    // Token address
    address public token;

    // Minimum amount of tokens an staker needs to stake
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
        address slasher
    );

    /**
     * @dev Emitted when `owner` withdraw the total `amount` of fees.
     */
    event FeeWithdrawn(uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token,
        uint256 _minimumStake,
        uint32 _lockPeriod,
        uint8 _feePercentage
    ) external payable virtual initializer {
        __Ownable_init_unchained();

        __Staking_init_unchained(
            _token,
            _minimumStake,
            _lockPeriod,
            _feePercentage
        );
    }

    function __Staking_init_unchained(
        address _token,
        uint256 _minimumStake,
        uint32 _lockPeriod,
        uint8 _feePercentage
    ) internal onlyInitializing {
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

    /**
     * @dev Set the minimum stake amount.
     * @param _minimumStake Minimum stake
     */
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

    /**
     * @dev Set the lock period for unstaking.
     * @param _lockPeriod Period in blocks to wait for token withdrawals after unstaking
     */
    function _setLockPeriod(uint32 _lockPeriod) private {
        require(_lockPeriod > 0, 'Must be a positive number');
        lockPeriod = _lockPeriod;
    }

    /**
     * @dev Set the fee percentage for slash.
     * @param _feePercentage Fee percentage for slash
     */
    function setFeePercentage(uint8 _feePercentage) external onlyOwner {
        _setFeePercentage(_feePercentage);
    }

    /**
     * @dev Set the fee percentage.
     * @param _feePercentage Fee percentage
     */
    function _setFeePercentage(uint8 _feePercentage) private {
        require(_feePercentage <= 100, 'Fee cannot exceed 100%');
        feePercentage = _feePercentage;
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
    ) external view override returns (Stakes.Staker memory) {
        return stakes[_staker];
    }

    /**
     * @dev Get list of stakers
     * @return List of staker's addresses, and stake data
     */
    function getListOfStakers()
        external
        view
        override
        returns (address[] memory, Stakes.Staker[] memory)
    {
        address[] memory _stakerAddresses = stakers;
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
    function stake(uint256 _tokens) external override {
        require(_tokens > 0, 'Must be a positive number');

        Stakes.Staker memory staker = stakes[msg.sender];
        require(
            staker.tokensAvailable().add(_tokens) >= minimumStake,
            'Total stake is below the minimum threshold'
        );

        if (staker.tokensStaked == 0) {
            staker = Stakes.Staker(0, 0, 0);
            stakes[msg.sender] = staker;
            stakers.push(msg.sender);
        }

        _safeTransferFrom(msg.sender, address(this), _tokens);

        stakes[msg.sender].deposit(_tokens);

        emit StakeDeposited(msg.sender, _tokens);
    }

    /**
     * @dev Unstake tokens from the staker stake, lock them until lock period expires.
     * @param _tokens Amount of tokens to unstake
     */
    function unstake(uint256 _tokens) external override {
        Stakes.Staker storage staker = stakes[msg.sender];

        require(_tokens > 0, 'Must be a positive number');

        uint256 stakeAvailabe = staker.tokensAvailable();
        require(stakeAvailabe >= _tokens, 'Insufficient amount to unstake');

        uint256 newStake = stakeAvailabe.sub(_tokens);
        require(
            newStake == 0 || newStake >= minimumStake,
            'Total stake is below the minimum threshold'
        );

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
     * @dev Withdraw staker tokens based on the locking period.
     */
    function withdraw() external override {
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

        _safeTransfer(_staker, tokensToWithdraw);

        emit StakeWithdrawn(_staker, tokensToWithdraw);
    }

    /**
     * @dev Slash the staker stake allocated to the escrow.
     * @param _staker Address of staker to slash
     * @param _escrowAddress Escrow address
     * @param _tokens Amount of tokens to slash from the indexer stake
     */
    function slash(
        address _slasher,
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) external override onlySlasher {
        require(_escrowAddress != address(0), 'Must be a valid address');

        Stakes.Staker storage staker = stakes[_staker];

        require(_tokens > 0, 'Must be a positive number');

        require(
            _tokens <= staker.tokensStaked,
            'Slash tokens exceed staked ones'
        );

        uint256 feeAmount = _tokens.mul(feePercentage).div(100);
        uint256 tokensToSlash = _tokens.sub(feeAmount);

        staker.release(tokensToSlash);

        feeBalance = feeBalance.add(feeAmount);

        _safeTransfer(_slasher, tokensToSlash);

        emit StakeSlashed(_staker, tokensToSlash, _escrowAddress, _slasher);
    }

    /**
     * @dev Withdraw fee tokens.
     */
    function withdrawFees() external onlyOwner {
        require(feeBalance > 0, 'No fees to withdraw');
        uint256 amount = feeBalance;
        feeBalance = 0;
        _safeTransfer(owner(), amount);
        emit FeeWithdrawn(amount);
    }

    /**
     * @dev Add a new slasher address.
     */
    function addSlasher(address _slasher) external onlyOwner {
        require(_slasher != address(0), 'Invalid slasher address');
        require(!slashers[_slasher], 'Address is already a slasher');

        slashers[_slasher] = true;
    }

    /**
     * @dev Remove an existing slasher address.
     */
    function removeSlasher(address _slasher) external onlyOwner {
        require(slashers[_slasher], 'Address is not a slasher');

        slashers[_slasher] = false;
    }

    function _safeTransfer(address to, uint256 value) internal {
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(token), to, value);
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 value
    ) internal {
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(token),
            from,
            to,
            value
        );
    }

    modifier onlySlasher() {
        require(slashers[msg.sender], 'Caller is not a slasher');
        _;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}
