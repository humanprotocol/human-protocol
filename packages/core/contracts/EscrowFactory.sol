// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/IStaking.sol';
import './Escrow.sol';

contract EscrowFactory is OwnableUpgradeable, UUPSUpgradeable {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'EscrowFactory: Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public staking;
    uint256 public minimumStake;

    event Launched(address indexed token, address indexed escrow);
    event LaunchedV2(
        address indexed token,
        address indexed escrow,
        string jobRequesterId
    );
    event SetStakingAddress(address indexed stakingAddress);
    event SetMinumumStake(uint256 indexed minimumStake);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _staking,
        uint256 _minimumStake
    ) external payable virtual initializer {
        __Ownable_init_unchained(msg.sender);
        require(_staking != address(0), ERROR_ZERO_ADDRESS);
        staking = _staking;
        minimumStake = _minimumStake;
    }

    /**
     * @dev Creates a new Escrow contract.
     *
     * @param token Token address to be associated with the Escrow contract.
     * @param trustedHandlers Array of addresses that will serve as the trusted handlers for the Escrow.
     * @param jobRequesterId String identifier for the job requester, used for tracking purposes.
     *
     * @return The address of the newly created Escrow contract.
     */
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

    function hasEscrow(address _address) external view returns (bool) {
        return escrowCounters[_address] != 0;
    }

    /**
     * @dev Set the Staking address.
     * @param _stakingAddress Staking address
     */
    function setStakingAddress(address _stakingAddress) external onlyOwner {
        _setStakingAddress(_stakingAddress);
    }

    function _setStakingAddress(address _stakingAddress) private {
        require(_stakingAddress != address(0), ERROR_ZERO_ADDRESS);
        staking = _stakingAddress;
        emit SetStakingAddress(_stakingAddress);
    }

    /**
     * @dev Set the minimum stake amount.
     * @param _minimumStake Minimum stake
     */
    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        _setMinimumStake(_minimumStake);
    }

    function _setMinimumStake(uint256 _minimumStake) private {
        require(_minimumStake > 0, 'Must be a positive number');
        minimumStake = _minimumStake;
        emit SetMinumumStake(minimumStake);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
