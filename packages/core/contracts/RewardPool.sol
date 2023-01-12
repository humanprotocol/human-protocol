// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/HMTokenInterface.sol';
import './interfaces/IRewardPool.sol';
import './utils/Math.sol';

/**
 * @title Reward Pool contract
 * @dev Reward Pool keeps slashed tokens, track of who slashed how much tokens, and distributes the reward after protocol fee.
 */
contract RewardPool is IRewardPool, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMath for uint256;

    // ERC20 Token address
    address public eip20;

    // Staking contract address
    address public staking;

    // Protocol Fee
    uint256 public fees;

    // Rewards per allocation
    mapping(address => Reward[]) public rewards;

    uint256 public totalFee;

    /**
     * @dev Emitted when a new reward record is created.
     */
    event RewardAdded(
        address indexed escrowAddress,
        address indexed slasher,
        uint256 tokens
    );

    function initialize(
        address _eip20,
        address _staking,
        uint256 _fees
    ) external payable virtual initializer {
        __Ownable_init_unchained();

        __RewardPool_init_unchained(_eip20, _staking, _fees);
    }

    function __RewardPool_init_unchained(
        address _eip20,
        address _staking,
        uint256 _fees
    ) internal onlyInitializing {
        eip20 = _eip20;
        staking = _staking;
        fees = _fees;
    }

    /**
     * @dev Add reward record
     * Protocol fee is deducted for each reward
     */
    function addReward(
        address _escrowAddress,
        address _slasher,
        uint256 _tokens
    ) external override onlyStaking {
        // If the reward is smaller than protocol fee, just keep as fee
        if (_tokens < fees) {
            totalFee = totalFee + _tokens;
            return;
        }

        // Deduct protocol fee for each reward
        uint256 rewardAfterFee = _tokens - fees;
        totalFee = totalFee + fees;

        // Add reward record
        Reward memory reward = Reward(_escrowAddress, _slasher, rewardAfterFee);
        rewards[_escrowAddress].push(reward);

        emit RewardAdded(_escrowAddress, _slasher, rewardAfterFee);
    }

    /**
     * @dev Return rewards for allocation
     */
    function getRewards(
        address _escrowAddress
    ) external view override returns (Reward[] memory) {
        return rewards[_escrowAddress];
    }

    /**
     * @dev Distribute rewards for allocation
     */
    function distributeReward(address _escrowAddress) external override {
        Reward[] memory rewardsForEscrow = rewards[_escrowAddress];
        HMTokenInterface token = HMTokenInterface(eip20);

        // Delete rewards for allocation
        delete rewards[_escrowAddress];

        // Transfer Tokens
        for (uint256 index = 0; index < rewardsForEscrow.length; index += 1) {
            Reward memory reward = rewardsForEscrow[index];
            token.transfer(reward.slasher, reward.tokens);
        }
    }

    function withdraw(address to) external override onlyOwner {
        HMTokenInterface token = HMTokenInterface(eip20);

        uint256 amount = totalFee;
        totalFee = 0;

        token.transfer(to, amount);
    }

    modifier onlyStaking() {
        require(staking == msg.sender, 'Caller is not staking contract');
        _;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
