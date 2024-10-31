// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IEscrow.sol';

contract Escrow is IEscrow, ReentrancyGuard {
    bytes4 private constant FUNC_SELECTOR_BALANCE_OF =
        bytes4(keccak256('balanceOf(address)'));

    string constant ERROR_ZERO_ADDRESS = 'Escrow: zero address';

    uint256 private constant BULK_MAX_VALUE = 1e9 * (10 ** 18);
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

    function getBalance() public view returns (uint256) {
        (bool success, bytes memory returnData) = token.staticcall(
            abi.encodeWithSelector(FUNC_SELECTOR_BALANCE_OF, address(this))
        );
        return success ? abi.decode(returnData, (uint256)) : 0;
    }

    function getTokenBalance(address _token) public view returns (uint256) {
        (bool success, bytes memory returnData) = _token.staticcall(
            abi.encodeWithSelector(FUNC_SELECTOR_BALANCE_OF, address(this))
        );
        return success ? abi.decode(returnData, (uint256)) : 0;
    }

    function addTrustedHandlers(
        address[] memory _handlers
    ) public override trusted {
        _addTrustedHandlers(_handlers);
    }

    function _addTrustedHandlers(address[] memory _handlers) internal {
        for (uint256 i = 0; i < _handlers.length; i++) {
            require(_handlers[i] != address(0), ERROR_ZERO_ADDRESS);
            areTrustedHandlers[_handlers[i]] = true;
            emit TrustedHandlerAdded(_handlers[i]);
        }
    }

    // The escrower puts the Token in the contract without an agentless
    // and assigsn a reputation oracle to payout the bounty of size of the
    // amount specified
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

    function cancel()
        public
        override
        trusted
        notBroke
        notComplete
        nonReentrant
        returns (bool)
    {
        _safeTransfer(token, canceler, remainingFunds);
        status = EscrowStatuses.Cancelled;
        remainingFunds = 0;
        emit Cancelled();
        return true;
    }

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

    // For backward compatibility: this function can only be called on existing escrows,
    // as the "Paid" status is not set anywhere for new escrows.
    function complete() external override notExpired trustedOrReputationOracle {
        require(status == EscrowStatuses.Paid, 'Escrow not in Paid state');
        status = EscrowStatuses.Complete;
        emit Completed();
    }

    function storeResults(
        string memory _url,
        string memory _hash
    ) external override trustedOrRecordingOracle notExpired {
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial,
            'Escrow not in Pending or Partial status state'
        );
        require(bytes(_url).length != 0, "URL can't be empty");
        require(bytes(_hash).length != 0, "Hash can't be empty");

        intermediateResultsUrl = _url;

        emit IntermediateStorage(_url, _hash);
    }

    /**
     * @dev Performs bulk payout to multiple workers
     * Escrow needs to be completed / cancelled, so that it can be paid out.
     * Every recipient is paid with the amount after reputation and recording oracle fees taken out.
     * If the amount is less than the fee, the recipient is not paid.
     * If the fee is zero, reputation, and recording oracle are not paid.
     * Payout will fail if any of the transaction fails.
     * If the escrow is fully paid out, meaning that the balance of the escrow is 0, it'll set as Paid.
     * If the escrow is partially paid out, meaning that the escrow still has remaining balance, it'll set as Partial.
     * This contract is only callable if the contract is not broke, not launched, not paid, not expired, by trusted parties.
     *
     * @param _recipients Array of recipients
     * @param _amounts Array of amounts to be paid to each recipient.
     * @param _url URL storing results as transaction details
     * @param _hash Hash of the results
     * @param _txId Transaction ID
     * @param forceComplete Boolean parameter indicating if remaining balance should be transferred to the escrow creator
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

        uint256 aggregatedBulkAmount = 0;
        uint256 cachedRemainingFunds = remainingFunds;

        for (uint256 i = 0; i < _amounts.length; i++) {
            uint256 amount = _amounts[i];
            require(amount > 0, 'Amount should be greater than zero');
            aggregatedBulkAmount += amount;
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, 'Bulk value too high');
        require(
            aggregatedBulkAmount <= cachedRemainingFunds,
            'Not enough balance'
        );

        cachedRemainingFunds -= aggregatedBulkAmount;

        require(bytes(_url).length != 0, "URL can't be empty");
        require(bytes(_hash).length != 0, "Hash can't be empty");

        finalResultsUrl = _url;
        finalResultsHash = _hash;

        uint256 totalFeePercentage = reputationOracleFeePercentage +
            recordingOracleFeePercentage +
            exchangeOracleFeePercentage;

        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 amount = _amounts[i];
            uint256 amountFee = (totalFeePercentage * amount) / 100;
            _safeTransfer(token, _recipients[i], amount - amountFee);
        }

        // Transfer oracle fees
        if (reputationOracleFeePercentage > 0) {
            _safeTransfer(
                token,
                reputationOracle,
                (reputationOracleFeePercentage * aggregatedBulkAmount) / 100
            );
        }
        if (recordingOracleFeePercentage > 0) {
            _safeTransfer(
                token,
                recordingOracle,
                (recordingOracleFeePercentage * aggregatedBulkAmount) / 100
            );
        }
        if (exchangeOracleFeePercentage > 0) {
            _safeTransfer(
                token,
                exchangeOracle,
                (exchangeOracleFeePercentage * aggregatedBulkAmount) / 100
            );
        }

        remainingFunds = cachedRemainingFunds;

        // Check the forceComplete flag and transfer remaining funds if true
        if (forceComplete && cachedRemainingFunds > 0) {
            _safeTransfer(token, launcher, cachedRemainingFunds);
            cachedRemainingFunds = 0;
        }

        if (cachedRemainingFunds == 0) {
            status = EscrowStatuses.Complete;
            emit BulkTransferV2(
                _txId,
                _recipients,
                _amounts,
                false,
                finalResultsUrl
            );
            emit Completed();
        } else {
            status = EscrowStatuses.Partial;
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
     * Calls the main bulkPayout function with forceComplete as false.
     *
     * @param _recipients Array of recipients
     * @param _amounts Array of amounts to be paid to each recipient.
     * @param _url URL storing results as transaction details
     * @param _hash Hash of the results
     * @param _txId Transaction ID
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

    modifier notPaid() {
        require(status != EscrowStatuses.Paid, 'Escrow in Paid status state');
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
