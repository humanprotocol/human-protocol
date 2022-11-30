// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import './interfaces/HMTokenInterface.sol';
import './interfaces/IRewardPool.sol';
import './utils/Math.sol';

/**
 * @title Reward Pool contract
 * @dev Reward Pool keeps slashed tokens, track of who slashed how much tokens, and distributes the reward after protocol fee.
 */
contract RewardPool is IRewardPool {
    using SafeMath for uint256;

    // ERC20 Token address
    address public immutable eip20;

    // Staking contract address
    address public immutable staking;

    // Protocol Fee
    uint256 public immutable fees;

    // Rewards per allocation
    mapping(address => Reward[]) public rewards;

    /**
     * @dev Emitted when a new reward record is created.
     */
    event RewardAdded(
        address indexed escrowAddress,
        address indexed slasher,
        uint256 tokens
    );

    constructor(address _eip20, address _staking, uint256 _fees) {
        eip20 = _eip20;
        staking = _staking;
        fees = _fees;
    }

    /**
     * @dev Add reward record
     * Protocol fee is duducted for each reward
     */
    function addReward(
        address _escrowAddress,
        address _slasher,
        uint256 _tokens
    ) external override onlyStaking {
        // If the reward is smaller than protocol fee, just keep as fee
        if (_tokens < fees) {
            return;
        }

        // Deduct protocol fee for each reward
        uint256 rewardAfterFee = _tokens - fees;

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
     * The function will be called from Staking contract,
     * when the escrow gets Completed state
     */
    function distributeReward(address _escrowAddress) external override {
        require(_escrowAddress == msg.sender, 'Caller is not escrow');

        Reward[] memory rewardsForEscrow = rewards[_escrowAddress];
        HMTokenInterface token = HMTokenInterface(eip20);

        // Delete rewards for allocation
        delete rewards[_escrowAddress];

        // Transfer Tokens
        for (uint256 index = 0; index < rewardsForEscrow.length; index += 1) {
            Reward memory reward = rewardsForEscrow[index];
            bool success = token.transfer(reward.slasher, reward.tokens);
            require(success, 'Transfer failed');
        }
    }

    modifier onlyStaking() {
        require(staking == msg.sender, 'Caller is not staking contract');
        _;
    }
}
