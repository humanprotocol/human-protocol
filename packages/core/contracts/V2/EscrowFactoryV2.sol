// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import '../interfaces/IStaking.sol';
import './EscrowV2.sol';

contract EscrowFactoryV2 is OwnableUpgradeable, UUPSUpgradeable {
    /// @dev All escrows default to 100 days (8640000 s).
    uint256 public constant STANDARD_DURATION = 8_640_000;

    string private constant ERROR_ZERO_ADDRESS = 'EscrowFactory: zero address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public staking;
    uint256 public minimumStake;
    address public admin;

    /// @custom:oz-upgrades-gap For future variables
    uint256[45] private __gap;

    event Launched(
        address indexed token,
        address indexed escrow,
        string jobRequesterId
    );
    event SetStakingAddress(address indexed stakingAddress);
    event SetMinimumStake(uint256 minimumStake);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialise the factory (UUPS pattern).
     * @param _staking        Deployed staking contract.
     * @param _minimumStake   Minimum stake required to protect an escrow.
     * @param _admin          Admin address for the factory.
     */
    function initialize(
        address _staking,
        uint256 _minimumStake,
        address _admin
    ) external payable initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        _setStakingAddress(_staking);
        _setMinimumStake(_minimumStake);
        admin = _admin;
    }

    /**
     * @notice Deploy a new `EscrowV2` instance.
     * @param token Funding token (ERC-20).
     * @param jobRequesterId   Off-chain tracking identifier.
     */
    function createEscrow(
        address token,
        string memory jobRequesterId
    ) external returns (address) {
        uint256 availableStake = IStaking(staking).getAvailableStake(
            msg.sender
        );
        require(availableStake >= minimumStake, 'Insufficient stake');

        EscrowV2 escrow = new EscrowV2(
            token,
            msg.sender,
            admin,
            STANDARD_DURATION
        );

        counter += 1;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);

        emit Launched(token, lastEscrow, jobRequesterId);
        return lastEscrow;
    }

    /** @notice Check whether an address is a factory-deployed escrow. */
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
        require(_minimumStake > 0, 'Minimum must be positive');
        minimumStake = _minimumStake;
        emit SetMinimumStake(_minimumStake);
    }

    /**
     * @dev Set the admin address.
     * @param _admin Admin address
     */
    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), ERROR_ZERO_ADDRESS);
        admin = _admin;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
