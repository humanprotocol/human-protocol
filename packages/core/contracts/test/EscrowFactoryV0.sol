// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import '../interfaces/IStaking.sol';
import '../Escrow.sol';

contract EscrowFactoryV0 is OwnableUpgradeable, UUPSUpgradeable {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'EscrowFactory: Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public staking;
    uint256 public minimumStake;

    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);
    event StakingAddressUpdated(address newStakingAddress);
    event MinimumStakeUpdated(uint256 newMinimumStake);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _staking,
        uint256 _minimumStake
    ) external payable virtual initializer {
        __Ownable_init_unchained();
        require(_staking != address(0), ERROR_ZERO_ADDRESS);
        staking = _staking;
        minimumStake = _minimumStake;
    }

    function createEscrow(
        address token,
        address[] memory trustedHandlers,
        string memory jobRequesterId
    ) external returns (address) {
        uint256 availableStake = IStaking(staking).getAvailableStake(
            msg.sender
        );
        require(
            availableStake >= minimumStake,
            'Insufficient stake to create an escrow.'
        );

        Escrow escrow = new Escrow(
            token,
            msg.sender,
            payable(msg.sender),
            STANDARD_DURATION,
            trustedHandlers
        );
        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);
        emit LaunchedV2(token, lastEscrow, jobRequesterId);
        return lastEscrow;
    }

    function updateStakingAddress(address _newStaking) external onlyOwner {
        require(_newStaking != address(0), ERROR_ZERO_ADDRESS);
        staking = _newStaking;
        emit StakingAddressUpdated(_newStaking);
    }

    function updateMinimumStake(uint256 _newMinimumStake) external onlyOwner {
        minimumStake = _newMinimumStake;
        emit MinimumStakeUpdated(_newMinimumStake);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;
}
