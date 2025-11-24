// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IEscrow.sol';

struct Fees {
    uint256 reputation;
    uint256 recording;
    uint256 exchange;
}

/**
 * @title Escrow Contract
 * @dev This contract manages the lifecycle of an escrow, including funding,
 * setup, payouts, and completion.
 */
contract Escrow is IEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    string private constant ERROR_ZERO_ADDRESS = 'Zero address';
    uint32 private constant BULK_MAX_COUNT = 100;

    event IntermediateStorage(string url, string hash);
    event Pending(string manifest, string hash);
    event PendingV2(
        string manifest,
        string hash,
        address reputationOracle,
        address recordingOracle,
        address exchangeOracle
    );
    event BulkTransfer(
        uint256 indexed txId,
        address[] recipients,
        uint256[] amounts,
        bool isPartial
    );
    event BulkTransferV2(
        uint256 indexed txId,
        address[] recipients,
        uint256[] amounts,
        bool isPartial,
        string finalResultsUrl
    );
    event BulkTransferV3(
        bytes32 indexed payoutId,
        address[] recipients,
        uint256[] amounts,
        bool isPartial,
        string finalResultsUrl,
        string finalResultsHash
    );
    event Cancelled();
    event Completed();
    event Fund(uint256 amount);
    event Withdraw(address token, uint256 amount);
    event CancellationRequested();
    event CancellationRefund(uint256 amount);

    EscrowStatuses public override status;

    address public reputationOracle;
    address public recordingOracle;
    address public exchangeOracle;

    address public immutable launcher;
    address public immutable admin;
    address public immutable escrowFactory;
    address public immutable token;

    uint8 public reputationOracleFeePercentage;
    uint8 public recordingOracleFeePercentage;
    uint8 public exchangeOracleFeePercentage;

    string public manifestUrl;
    string public manifestHash;
    string public intermediateResultsUrl;
    string public intermediateResultsHash;
    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;
    mapping(bytes32 => bool) private payouts;
    uint256 public remainingFunds;
    uint256 public reservedFunds;

    /**
     * @param _token     Address of the token used in the escrow.
     * @param _launcher  Creator of the escrow.
     * @param _admin     Admin address for the escrow.
     * @param _duration  Escrow lifetime (seconds).
     */
    constructor(
        address _token,
        address _launcher,
        address _admin,
        uint256 _duration
    ) {
        require(_launcher != address(0), ERROR_ZERO_ADDRESS);
        require(_admin != address(0), ERROR_ZERO_ADDRESS);
        require(_token != address(0), ERROR_ZERO_ADDRESS);
        require(_duration > 0, 'Duration is 0');

        token = _token;
        launcher = _launcher;
        admin = _admin;
        escrowFactory = msg.sender;

        status = EscrowStatuses.Launched;
        duration = _duration + block.timestamp;
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
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Sets up the escrow with oracles, manifest and fees.
     * @param _reputationOracle Address of the reputation oracle.
     * @param _recordingOracle Address of the recording oracle.
     * @param _exchangeOracle Address of the exchange oracle.
     * @param _reputationOracleFeePercentage Fee percentage for the reputation oracle.
     * @param _recordingOracleFeePercentage Fee percentage for the recording oracle.
     * @param _exchangeOracleFeePercentage Fee percentage for the exchange oracle.
     * @param _url URL for the escrow manifest.
     * @param _hash Hash of the escrow manifest.
     */
    function setup(
        address _reputationOracle,
        address _recordingOracle,
        address _exchangeOracle,
        uint8 _reputationOracleFeePercentage,
        uint8 _recordingOracleFeePercentage,
        uint8 _exchangeOracleFeePercentage,
        string calldata _url,
        string calldata _hash
    ) external override adminLauncherOrFactory notExpired {
        require(_reputationOracle != address(0), 'Invalid reputation oracle');
        require(_recordingOracle != address(0), 'Invalid recording oracle');
        require(_exchangeOracle != address(0), 'Invalid exchange oracle');

        uint256 totalFeePercentage = _reputationOracleFeePercentage +
            _recordingOracleFeePercentage +
            _exchangeOracleFeePercentage;
        require(totalFeePercentage <= 100, 'Percentage out of bounds');
        require(status == EscrowStatuses.Launched, 'Wrong status');

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
        require(remainingFunds > 0, 'Zero balance');

        emit PendingV2(
            _url,
            _hash,
            _reputationOracle,
            _recordingOracle,
            _exchangeOracle
        );
        emit Fund(remainingFunds);
    }

    /**
     * @dev Initiates a cancellation request. If expired, it finalizes immediately.
     */
    function requestCancellation()
        external
        override
        adminOrLauncher
        nonReentrant
    {
        require(
            remainingFunds != 0 || status == EscrowStatuses.Launched,
            'Invalid status'
        );

        EscrowStatuses previousStatus = status;
        status = EscrowStatuses.ToCancel;
        emit CancellationRequested();

        if (duration <= block.timestamp) {
            _finalize();
            return;
        }

        if (previousStatus == EscrowStatuses.Launched) {
            uint256 balance = getBalance();
            if (balance > 0) {
                IERC20(token).safeTransfer(launcher, balance);
            }
            status = EscrowStatuses.Cancelled;
            emit Cancelled();
        }
    }

    /**
     * @dev Withdraws excess funds from the escrow for a specific token.
     * @param _token Address of the token to withdraw.
     */
    function withdraw(
        address _token
    ) external override adminOrLauncher nonReentrant {
        uint256 amount;
        if (_token == token) {
            uint256 balance = getBalance();
            require(balance > remainingFunds, 'No funds');
            amount = balance - remainingFunds;
        } else {
            amount = getTokenBalance(_token);
        }

        require(amount > 0, 'No funds');
        IERC20(_token).safeTransfer(msg.sender, amount);

        emit Withdraw(_token, amount);
    }

    /**
     * @dev Finalizes a previously requested cancellation and transfers the remaining funds to the launcher.
     */
    function cancel() external override notExpired adminOrReputationOracle {
        require(status == EscrowStatuses.ToCancel, 'Invalid status');
        _finalize();
    }

    /**
     * @dev Completes the escrow and transfers the remaining funds to the launcher.
     */
    function complete() external override notExpired adminOrReputationOracle {
        require(
            status == EscrowStatuses.Paid ||
                status == EscrowStatuses.Partial ||
                (status == EscrowStatuses.Pending &&
                    bytes(intermediateResultsUrl).length > 0 &&
                    reservedFunds == 0),
            'Invalid status'
        );
        _finalize();
    }

    /**
     * @dev Finalizes the escrow, transferring remaining funds to the launcher
     * and updating the status to Complete or Cancelled.
     */
    function _finalize() private {
        EscrowStatuses _status = status;
        uint256 _remaining = remainingFunds;

        if (_remaining > 0) {
            IERC20 tokenContract = IERC20(token);
            tokenContract.safeTransfer(launcher, _remaining);
            if (_status == EscrowStatuses.ToCancel) {
                emit CancellationRefund(_remaining);
            }
            remainingFunds = 0;
            reservedFunds = 0;
        }

        if (_status == EscrowStatuses.ToCancel) {
            status = EscrowStatuses.Cancelled;
            emit Cancelled();
        } else {
            status = EscrowStatuses.Complete;
            emit Completed();
        }
    }

    /**
     * @dev Stores intermediate results in the escrow.
     * @param _url URL of the intermediate results.
     * @param _hash Hash of the intermediate results.
     */
    function storeResults(
        string calldata _url,
        string calldata _hash
    ) external override adminOrRecordingOracle notExpired {
        require(false, 'DEPRECATED_SIGNATURE');
    }

    /**
     * @dev Stores intermediate results in the escrow.
     * @param _url URL of the intermediate results.
     * @param _hash Hash of the intermediate results.
     * @param _fundsToReserve Amount of funds to reserve for future payouts.
     */
    function storeResults(
        string calldata _url,
        string calldata _hash,
        uint256 _fundsToReserve
    ) external override adminOrRecordingOracle notExpired {
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial ||
                status == EscrowStatuses.ToCancel,
            'Invalid status'
        );
        if (_fundsToReserve > 0) {
            require(bytes(_url).length != 0, 'Empty URL');
            require(bytes(_hash).length != 0, 'Empty hash');
        }
        require(
            _fundsToReserve <= remainingFunds - reservedFunds,
            'Insufficient unreserved funds'
        );

        intermediateResultsUrl = _url;
        intermediateResultsHash = _hash;
        reservedFunds += _fundsToReserve;

        emit IntermediateStorage(_url, _hash);

        if (status == EscrowStatuses.ToCancel) {
            uint256 unreservedFunds = remainingFunds - reservedFunds;
            if (unreservedFunds > 0) {
                IERC20(token).safeTransfer(launcher, unreservedFunds);
                emit CancellationRefund(unreservedFunds);
                remainingFunds = reservedFunds;
            }
            if (remainingFunds == 0) {
                status = EscrowStatuses.Cancelled;
                emit Cancelled();
            }
        }
    }

    function _calculateTotalBulkAmount(
        uint256[] calldata amounts
    ) internal pure returns (uint256 total) {
        uint256 len = amounts.length;
        for (uint256 i; i < len; ) {
            uint256 amount = amounts[i];
            require(amount > 0, 'Zero amount');
            total += amount;
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Bulk payout to multiple recipients.
     * @param _recipients Array of recipient addresses.
     * @param _amounts Array of amounts to be transferred to each recipient.
     * @param _url URL of the final results.
     * @param _hash Hash of the final results.
     * @param _txId Transaction ID for tracking.
     * @param forceComplete  Whether to force completion of the escrow and transfer remaining funds to the launcher.
     */
    function bulkPayOut(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _url,
        string calldata _hash,
        uint256 _txId,
        bool forceComplete
    ) external override {
        require(false, 'DEPRECATED_SIGNATURE');
    }

    /**
     * @dev Bulk payout to multiple recipients.
     * @param _recipients Array of recipient addresses.
     * @param _amounts Array of amounts to be transferred to each recipient.
     * @param _url URL of the final results.
     * @param _hash Hash of the final results.
     * @param _payoutId Payout ID for tracking.
     * @param forceComplete  Whether to force completion of the escrow and transfer remaining funds to the launcher.
     */
    function bulkPayOut(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _url,
        string calldata _hash,
        string calldata _payoutId,
        bool forceComplete
    ) external override adminOrReputationOracle notExpired nonReentrant {
        bytes32 payoutId = keccak256(bytes(_payoutId));
        require(remainingFunds != 0, 'No funds');
        require(!payouts[payoutId], 'payoutId already exists');
        require(_recipients.length == _amounts.length, 'Length mismatch');
        require(_amounts.length > 0, 'Empty amounts');
        require(_recipients.length <= BULK_MAX_COUNT, 'Too many recipients');
        require(
            bytes(_url).length != 0 && bytes(_hash).length != 0,
            'Empty url/hash'
        );

        uint256 totalBulkAmount = _calculateTotalBulkAmount(_amounts);
        require(totalBulkAmount <= reservedFunds, 'Not enough funds');

        uint256 length = _recipients.length;
        uint256[] memory netAmounts = new uint256[](length + 3);
        address[] memory eventRecipients = new address[](length + 3);

        IERC20 erc20 = IERC20(token);
        Fees memory fees;

        for (uint256 i; i < length; ) {
            uint256 amount = _amounts[i];
            uint256 reputationOracleFee = (reputationOracleFeePercentage *
                amount) / 100;
            uint256 recordingOracleFee = (recordingOracleFeePercentage *
                amount) / 100;
            uint256 exchangeOracleFee = (exchangeOracleFeePercentage * amount) /
                100;

            fees.reputation += reputationOracleFee;
            fees.recording += recordingOracleFee;
            fees.exchange += exchangeOracleFee;

            uint256 net = amount -
                reputationOracleFee -
                recordingOracleFee -
                exchangeOracleFee;
            netAmounts[i] = net;
            address to = _recipients[i];
            eventRecipients[i] = to;

            erc20.safeTransfer(to, net);
            unchecked {
                ++i;
            }
        }

        if (reputationOracleFeePercentage > 0) {
            erc20.safeTransfer(reputationOracle, fees.reputation);
            eventRecipients[length] = reputationOracle;
            netAmounts[length] = fees.reputation;
            unchecked {
                ++length;
            }
        }
        if (recordingOracleFeePercentage > 0) {
            erc20.safeTransfer(recordingOracle, fees.recording);
            eventRecipients[length] = recordingOracle;
            netAmounts[length] = fees.recording;
            unchecked {
                ++length;
            }
        }
        if (exchangeOracleFeePercentage > 0) {
            erc20.safeTransfer(exchangeOracle, fees.exchange);
            eventRecipients[length] = exchangeOracle;
            netAmounts[length] = fees.exchange;
            unchecked {
                ++length;
            }
        }

        remainingFunds -= totalBulkAmount;
        reservedFunds -= totalBulkAmount;

        finalResultsUrl = _url;
        finalResultsHash = _hash;
        payouts[payoutId] = true;

        bool isPartial = remainingFunds != 0 && !forceComplete;

        emit BulkTransferV3(
            payoutId,
            eventRecipients,
            netAmounts,
            isPartial,
            _url,
            _hash
        );

        if (!isPartial) {
            _finalize();
        } else if (status != EscrowStatuses.ToCancel) {
            status = EscrowStatuses.Partial;
        }
    }

    modifier adminOrLauncher() {
        require(msg.sender == admin || msg.sender == launcher, 'Unauthorised');
        _;
    }

    modifier adminLauncherOrFactory() {
        require(
            msg.sender == admin ||
                msg.sender == launcher ||
                msg.sender == escrowFactory,
            'Unauthorised'
        );
        _;
    }

    modifier adminOrReputationOracle() {
        require(
            msg.sender == admin || msg.sender == reputationOracle,
            'Unauthorised'
        );
        _;
    }

    modifier adminOrRecordingOracle() {
        require(
            msg.sender == admin || msg.sender == recordingOracle,
            'Unauthorised'
        );
        _;
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Expired');
        _;
    }
}
