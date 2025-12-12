// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IStaking.sol';
import './Escrow.sol';

contract EscrowFactory is OwnableUpgradeable, UUPSUpgradeable {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public staking;
    uint256 public minimumStake;
    address public admin;

    using SafeERC20 for IERC20;

    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);
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
        __Ownable_init_unchained();
        require(_staking != address(0), ERROR_ZERO_ADDRESS);
        _setStakingAddress(_staking);
        _setMinimumStake(_minimumStake);
        _setEscrowAdmin(msg.sender);
    }

    function _launchEscrow(
        address _token,
        string calldata _jobRequesterId
    ) private {
        uint256 availableStake = IStaking(staking).getAvailableStake(
            msg.sender
        );
        require(availableStake >= minimumStake, 'Insufficient stake');
        require(admin != address(0), ERROR_ZERO_ADDRESS);

        Escrow escrow = new Escrow(
            _token,
            msg.sender,
            admin,
            STANDARD_DURATION
        );
        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);

        emit LaunchedV2(_token, lastEscrow, _jobRequesterId);
    }

    /**
     * @dev Creates a new Escrow contract.
     *
     * @param _token Token address to be associated with the Escrow contract.
     * @param _jobRequesterId String identifier for the job requester, used for tracking purposes.
     *
     * @return The address of the newly created Escrow contract.
     */
    function createEscrow(
        address _token,
        string calldata _jobRequesterId
    ) external returns (address) {
        _launchEscrow(_token, _jobRequesterId);
        return lastEscrow;
    }

    /**
     * @dev Creates a new Escrow contract and funds it in one transaction.
     * Requires the caller to have approved the factory for the token and amount.
     * @param _token Token address to be associated with the Escrow contract.
     * @param _amount Amount of tokens to fund the Escrow with.
     * @param _jobRequesterId String identifier for the job requester, used for tracking purposes.
     * @param _reputationOracle Address of the reputation oracle.
     * @param _recordingOracle Address of the recording oracle.
     * @param _exchangeOracle Address of the exchange oracle.
     * @param _reputationOracleFeePercentage Fee percentage for the reputation oracle.
     * @param _recordingOracleFeePercentage Fee percentage for the recording oracle.
     * @param _exchangeOracleFeePercentage Fee percentage for the exchange oracle.
     * @param _url URL for the escrow manifest.
     * @param _hash Hash of the escrow manifest.
     * @return The address of the newly created Escrow contract.
     */
    function createFundAndSetupEscrow(
        address _token,
        uint256 _amount,
        string calldata _jobRequesterId,
        address _reputationOracle,
        address _recordingOracle,
        address _exchangeOracle,
        uint8 _reputationOracleFeePercentage,
        uint8 _recordingOracleFeePercentage,
        uint8 _exchangeOracleFeePercentage,
        string calldata _url,
        string calldata _hash
    ) external returns (address) {
        require(_amount > 0, 'Amount is 0');

        _launchEscrow(_token, _jobRequesterId);
        IERC20(_token).safeTransferFrom(
            msg.sender,
            address(lastEscrow),
            _amount
        );
        Escrow(lastEscrow).setup(
            _reputationOracle,
            _recordingOracle,
            _exchangeOracle,
            _reputationOracleFeePercentage,
            _recordingOracleFeePercentage,
            _exchangeOracleFeePercentage,
            _url,
            _hash
        );

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

    /**
     * @dev Set the admin address.
     * @param _admin Admin address
     */
    function setAdmin(address _admin) external onlyOwner {
        _setEscrowAdmin(_admin);
    }

    function _setEscrowAdmin(address _admin) private {
        require(_admin != address(0), ERROR_ZERO_ADDRESS);
        admin = _admin;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;
}
