// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IEscrow.sol';

/**
 * @title Escrow Contract
 * @dev This contract manages the lifecycle of an escrow, including funding,
 * setup, payouts, and completion. It supports trusted handlers and oracles
 * for managing the escrow process.
 */
contract Escrow is IEscrow, ReentrancyGuard {
    bytes4 private constant FUNC_SELECTOR_BALANCE_OF =
        bytes4(keccak256('balanceOf(address)'));

    string constant ERROR_ZERO_ADDRESS = 'Escrow: zero address';

    uint32 private constant BULK_MAX_COUNT = 100;

    event TrustedHandlerAdded(address _handler);
    event IntermediateStorage(string _url, string _hash);
    event Pending(string manifest, string hash);
    event PendingV2(
        string manifest,
        string hash,
        address reputationOracle,
        address recordingOracle,
        address exchangeOracle
    );
    event BulkTransfer(
        uint256 indexed _txId,
        address[] _recipients,
        uint256[] _amounts,
        bool _isPartial
    );
    event BulkTransferV2(
        uint256 indexed _txId,
        address[] _recipients,
        uint256[] _amounts,
        bool _isPartial,
        string finalResultsUrl
    );
    event Cancelled();
    event Completed();
    event Fund(uint256 _amount);
    event Withdraw(address _token, uint256 _amount);
    event CancellationRequested();
    event CancellationRefund(uint256 amount);

    EscrowStatuses public override status;

    address public reputationOracle;
    address public recordingOracle;
    address public exchangeOracle;
    address public launcher;
    address payable public canceler;
    address public escrowFactory;

    uint8 public reputationOracleFeePercentage;
    uint8 public recordingOracleFeePercentage;
    uint8 public exchangeOracleFeePercentage;

    address public token;

    string public manifestUrl;
    string public manifestHash;

    string public intermediateResultsUrl;

    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;

    mapping(address => bool) public areTrustedHandlers;

    uint256 public remainingFunds;
    uint256 public reservedFunds;

    /**
     * @dev Constructor to initialize the escrow contract.
     * @param _token Address of the token used in the escrow.
     * @param _launcher Address of the launcher (creator) of the escrow.
     * @param _canceler Address of the canceler who can cancel the escrow.
     * @param _duration Duration of the escrow in seconds.
     * @param _handlers Array of trusted handler addresses.
     */
    constructor(
        address _token,
        address _launcher,
        address payable _canceler,
        uint256 _duration,
        address[] memory _handlers
    ) {
        require(_token != address(0), ERROR_ZERO_ADDRESS);
        require(_canceler != address(0), ERROR_ZERO_ADDRESS);

        token = _token;
        status = EscrowStatuses.Launched;
        duration = _duration + block.timestamp;
        launcher = _launcher;
        canceler = _canceler;
        escrowFactory = msg.sender;
        areTrustedHandlers[_launcher] = true;
        areTrustedHandlers[_canceler] = true;
        _addTrustedHandlers(_handlers);
    }

    /**
     * @dev Returns the balance of the escrow contract for the main token.
     */
    function getBalance() public view returns (uint256) {
        return getTokenBalance(token);
    }

    /**
     * @dev Returns the balance of the escrow contract for a specific token.
     * @param _token Address of the token to check the balance for.
     */
    function getTokenBalance(address _token) public view returns (uint256) {
        (bool success, bytes memory returnData) = _token.staticcall(
            abi.encodeWithSelector(FUNC_SELECTOR_BALANCE_OF, address(this))
        );
        return success ? abi.decode(returnData, (uint256)) : 0;
    }

    /**
     * @dev Adds trusted handlers to the contract.
     * @param _handlers Array of addresses to be added as trusted handlers.
     */
    function addTrustedHandlers(
        address[] memory _handlers
    ) public override trusted {
        _addTrustedHandlers(_handlers);
    }

    /**
     * @dev Internal function to add trusted handlers.
     * @param _handlers Array of addresses to be added as trusted handlers.
     */
    function _addTrustedHandlers(address[] memory _handlers) internal {
        for (uint256 i = 0; i < _handlers.length; i++) {
            require(_handlers[i] != address(0), ERROR_ZERO_ADDRESS);
            areTrustedHandlers[_handlers[i]] = true;
            emit TrustedHandlerAdded(_handlers[i]);
        }
    }

    /**
     * @dev Sets up the escrow with oracles and manifest details.
     * @param _reputationOracle Address of the reputation oracle.
     * @param _recordingOracle Address of the recording oracle.
     * @param _exchangeOracle Address of the exchange oracle.
     * @param _reputationOracleFeePercentage Fee percentage for the reputation oracle.
     * @param _recordingOracleFeePercentage Fee percentage for the recording oracle.
     * @param _exchangeOracleFeePercentage Fee percentage for the exchange oracle.
     * @param _url URL of the manifest.
     * @param _hash Hash of the manifest.
     */
    function setup(
        address _reputationOracle,
        address _recordingOracle,
        address _exchangeOracle,
        uint8 _reputationOracleFeePercentage,
        uint8 _recordingOracleFeePercentage,
        uint8 _exchangeOracleFeePercentage,
        string memory _url,
        string memory _hash
    ) external override trusted notExpired {
        require(
            _reputationOracle != address(0),
            'Invalid reputation oracle address'
        );
        require(
            _recordingOracle != address(0),
            'Invalid recording oracle address'
        );
        require(
            _exchangeOracle != address(0),
            'Invalid exchange oracle address'
        );
        uint256 _totalFeePercentage = _reputationOracleFeePercentage +
            _recordingOracleFeePercentage +
            _exchangeOracleFeePercentage;
        require(_totalFeePercentage <= 100, 'Percentage out of bounds');

        require(
            status == EscrowStatuses.Launched,
            'Escrow not in Launched status state'
        );

        reputationOracle = _reputationOracle;
        recordingOracle = _recordingOracle;
        exchangeOracle = _exchangeOracle;

        reputationOracleFeePercentage = _reputationOracleFeePercentage;
        recordingOracleFeePercentage = _recordingOracleFeePercentage;
        exchangeOracleFeePercentage = _exchangeOracleFeePercentage;

        manifestUrl = _url;
        manifestHash = _hash;
        status = EscrowStatuses.Pending;

        remainingFunds = getBalance();
        require(remainingFunds > 0, 'Escrow balance is zero');

        emit PendingV2(
            manifestUrl,
            manifestHash,
            reputationOracle,
            recordingOracle,
            exchangeOracle
        );
        emit Fund(remainingFunds);
    }

    /**
     * @dev Cancels the escrow and transfers remaining funds to the canceler.
     * @return bool indicating success of the cancellation.
     */
    function cancel()
        public
        override
        trusted
        notBroke
        notComplete
        nonReentrant
        returns (bool)
    {
        status = EscrowStatuses.ToCancel;
        emit CancellationRequested();
        return true;
    }

    /**
     * @dev Withdraws excess funds from the escrow for a specific token.
     * @param _token Address of the token to withdraw.
     * @return bool indicating success of the withdrawal.
     */
    function withdraw(
        address _token
    ) public override trusted nonReentrant returns (bool) {
        uint256 _amount;
        if (_token == token) {
            uint256 _balance = getBalance();
            require(_balance > remainingFunds, 'No funds to withdraw');
            _amount = _balance - remainingFunds;
        } else {
            _amount = getTokenBalance(_token);
        }

        _safeTransfer(_token, canceler, _amount);

        emit Withdraw(_token, _amount);
        return true;
    }

    /**
     * @dev Completes the escrow, transferring remaining funds to the launcher.
     */
    function complete() external override notExpired trustedOrReputationOracle {
        require(
            status == EscrowStatuses.Paid || status == EscrowStatuses.Partial,
            'Escrow not in Paid or Partial state'
        );
        _finalize();
    }

    function _finalize() private {
        if (remainingFunds > 0) {
            _safeTransfer(token, launcher, remainingFunds);
            remainingFunds = 0;
            reservedFunds = 0;
        }
        if (status == EscrowStatuses.ToCancel) {
            status = EscrowStatuses.Cancelled;
            emit Cancelled();
        } else {
            status = EscrowStatuses.Complete;
            emit Completed();
        }
    }

    /**
     * @dev Stores intermediate results during the escrow process.
     * @param _url URL of the intermediate results.
     * @param _hash Hash of the intermediate results.
     * @param _fundsToReserve Amount of funds to reserve for the escrow.
     */
    function storeResults(
        string memory _url,
        string memory _hash,
        uint256 _fundsToReserve
    ) external override trustedOrRecordingOracle notExpired {
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial ||
                status == EscrowStatuses.ToCancel,
            'Escrow not in Pending, Partial or ToCancel status state'
        );
        require(bytes(_url).length != 0, "URL can't be empty");
        require(bytes(_hash).length != 0, "Hash can't be empty");
        require(
            _fundsToReserve <= remainingFunds - reservedFunds,
            'Not enough unreserved funds'
        );

        intermediateResultsUrl = _url;
        reservedFunds += _fundsToReserve;

        emit IntermediateStorage(_url, _hash);

        if (status == EscrowStatuses.ToCancel) {
            uint256 unreservedFunds = remainingFunds - reservedFunds;
            if (unreservedFunds > 0) {
                _safeTransfer(token, launcher, unreservedFunds);
                emit CancellationRefund(unreservedFunds);
                remainingFunds = reservedFunds;
            }
        }
    }

    /**
     * @dev Performs bulk payout to multiple recipients with oracle fees deducted.
     * @param _recipients Array of recipient addresses.
     * @param _amounts Array of amounts to be paid to each recipient.
     * @param _url URL storing results as transaction details.
     * @param _hash Hash of the results.
     * @param _txId Transaction ID.
     * @param forceComplete Boolean indicating if remaining balance should be transferred to the launcher.
     */
    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId,
        bool forceComplete
    )
        public
        override
        trustedOrReputationOracle
        notBroke
        notLaunched
        notExpired
        nonReentrant
    {
        require(
            _recipients.length == _amounts.length,
            "Amount of recipients and values don't match"
        );
        require(_amounts.length > 0, 'Amounts should not be empty');
        require(_recipients.length < BULK_MAX_COUNT, 'Too many recipients');
        require(
            status != EscrowStatuses.Complete &&
                status != EscrowStatuses.Cancelled,
            'Invalid status'
        );
        require(
            bytes(_url).length != 0 && bytes(_hash).length != 0,
            'URL or hash is empty'
        );

        uint256 totalBulkAmount = 0;

        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 amount = _amounts[i];
            require(amount > 0, 'Amount should be greater than zero');
            totalBulkAmount += amount;
        }
        require(totalBulkAmount <= reservedFunds, 'Not enough reserved funds');

        uint256 totalReputationOracleFee = 0;
        uint256 totalRecordingOracleFee = 0;
        uint256 totalExchangeOracleFee = 0;

        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 amount = _amounts[i];
            uint256 reputationOracleFee = (reputationOracleFeePercentage *
                amount) / 100;
            uint256 recordingOracleFee = (recordingOracleFeePercentage *
                amount) / 100;
            uint256 exchangeOracleFee = (exchangeOracleFeePercentage * amount) /
                100;

            totalReputationOracleFee += reputationOracleFee;
            totalRecordingOracleFee += recordingOracleFee;
            totalExchangeOracleFee += exchangeOracleFee;

            _safeTransfer(
                token,
                _recipients[i],
                amount -
                    reputationOracleFee -
                    recordingOracleFee -
                    exchangeOracleFee
            );
        }

        // Transfer oracle fees
        if (reputationOracleFeePercentage > 0) {
            _safeTransfer(token, reputationOracle, totalReputationOracleFee);
        }
        if (recordingOracleFeePercentage > 0) {
            _safeTransfer(token, recordingOracle, totalRecordingOracleFee);
        }
        if (exchangeOracleFeePercentage > 0) {
            _safeTransfer(token, exchangeOracle, totalExchangeOracleFee);
        }
        remainingFunds -= totalBulkAmount;
        reservedFunds -= totalBulkAmount;

        finalResultsUrl = _url;
        finalResultsHash = _hash;

        if (remainingFunds == 0 || forceComplete) {
            emit BulkTransferV2(
                _txId,
                _recipients,
                _amounts,
                false,
                finalResultsUrl
            );
            _finalize();
        } else {
            if (status != EscrowStatuses.ToCancel) {
                status = EscrowStatuses.Partial;
            }
            emit BulkTransferV2(
                _txId,
                _recipients,
                _amounts,
                true,
                finalResultsUrl
            );
        }
    }

    /**
     * @dev Overloaded function to perform bulk payout with default forceComplete set to false.
     * @param _recipients Array of recipient addresses.
     * @param _amounts Array of amounts to be paid to each recipient.
     * @param _url URL storing results as transaction details.
     * @param _hash Hash of the results.
     * @param _txId Transaction ID.
     */
    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId
    ) external {
        bulkPayOut(_recipients, _amounts, _url, _hash, _txId, false);
    }

    /**
     * @dev Internal function to safely transfer tokens.
     * @param _token Address of the token to transfer.
     * @param to Address of the recipient.
     * @param value Amount to transfer.
     */
    function _safeTransfer(address _token, address to, uint256 value) internal {
        SafeERC20.safeTransfer(IERC20(_token), to, value);
    }

    modifier trusted() {
        require(areTrustedHandlers[msg.sender], 'Address calling not trusted');
        _;
    }

    modifier trustedOrReputationOracle() {
        require(
            areTrustedHandlers[msg.sender] || msg.sender == reputationOracle,
            'Address calling not trusted'
        );
        _;
    }

    modifier trustedOrRecordingOracle() {
        require(
            areTrustedHandlers[msg.sender] || msg.sender == recordingOracle,
            'Address calling not trusted'
        );
        _;
    }

    modifier notBroke() {
        require(remainingFunds != 0, 'Token contract out of funds');
        _;
    }

    modifier notComplete() {
        require(
            status != EscrowStatuses.Complete,
            'Escrow in Complete status state'
        );
        _;
    }

    modifier notLaunched() {
        require(
            status != EscrowStatuses.Launched,
            'Escrow in Launched status state'
        );
        _;
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Contract expired');
        _;
    }
}
