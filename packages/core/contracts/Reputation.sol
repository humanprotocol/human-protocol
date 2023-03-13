// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './utils/SignedSafeMath.sol';
import './interfaces/IStaking.sol';

contract Reputation is OwnableUpgradeable, UUPSUpgradeable {
    using SignedSafeMath for int256;
    using Stakes for Stakes.Staker;

    struct Worker {
        address workerAddress;
        int256 reputation;
    }

    // Staking contract address
    address public staking;
    uint256 public minimumStake;
    int256 private constant MIN_REPUTATION = 1;
    int256 private constant MAX_REPUTATION = 100;
    mapping(address => int256) public reputations;

    function initialize(
        address _staking,
        uint256 _minimumStake
    ) external payable virtual initializer {
        __Ownable_init_unchained();
        __Reputation_init_unchained(_staking, _minimumStake);
    }

    function __Reputation_init_unchained(
        address _staking,
        uint256 _minimumStake
    ) internal onlyInitializing {
        require(_staking != address(0), 'Zero address provided');
        staking = _staking;
        _setMinimumStake(_minimumStake);
    }

    function addReputations(Worker[] memory _workers) public {
        Stakes.Staker memory staker = IStaking(staking).getStaker(msg.sender);
        require(
            staker.tokensAvailable() >= minimumStake,
            'Needs to stake HMT tokens to modify reputations.'
        );

        for (uint256 i = 0; i < _workers.length; i++) {
            if (
                reputations[_workers[i].workerAddress].add(
                    _workers[i].reputation
                ) >
                MAX_REPUTATION ||
                (reputations[_workers[i].workerAddress] == 0 &&
                    _workers[i].reputation.add(50) > MAX_REPUTATION)
            ) {
                reputations[_workers[i].workerAddress] = MAX_REPUTATION;
            } else if (
                (reputations[_workers[i].workerAddress] == 0 &&
                    _workers[i].reputation.add(50) < MIN_REPUTATION) ||
                (reputations[_workers[i].workerAddress].add(
                    _workers[i].reputation
                ) <
                    MIN_REPUTATION &&
                    reputations[_workers[i].workerAddress] != 0)
            ) {
                reputations[_workers[i].workerAddress] = MIN_REPUTATION;
            } else {
                if (reputations[_workers[i].workerAddress] == 0) {
                    reputations[_workers[i].workerAddress] = _workers[i]
                        .reputation
                        .add(50);
                } else {
                    reputations[_workers[i].workerAddress] = reputations[
                        _workers[i].workerAddress
                    ].add(_workers[i].reputation);
                }
            }
        }
    }

    function getReputations(
        address[] memory _workers
    ) public view returns (Worker[] memory) {
        Worker[] memory returnedValues = new Worker[](_workers.length);

        for (uint256 i = 0; i < _workers.length; i++) {
            returnedValues[i] = Worker(_workers[i], reputations[_workers[i]]);
        }

        return returnedValues;
    }

    function getRewards(
        int256 balance,
        address[] memory _workers
    ) public view returns (int256[] memory) {
        int256[] memory returnedValues = new int256[](_workers.length);
        int256 totalReputation = 0;

        for (uint256 i = 0; i < _workers.length; i++) {
            totalReputation = totalReputation.add(reputations[_workers[i]]);
        }

        for (uint256 i = 0; i < _workers.length; i++) {
            returnedValues[i] = balance.mul(reputations[_workers[i]]).div(
                totalReputation
            );
        }

        return returnedValues;
    }

    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        _setMinimumStake(_minimumStake);
    }

    function _setMinimumStake(uint256 _minimumStake) private {
        require(_minimumStake > 0, 'Must be a positive number');
        minimumStake = _minimumStake;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;

    /** TEST 2 */
}
