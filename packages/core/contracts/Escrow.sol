// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IEscrow.sol';

/**
 * @title Escrow Contract
 * @dev This contract manages the lifecycle of an escrow, including funding,
 * setup, payouts, and completion.
 */
contract Escrow is IEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    string constant ERROR_ZERO_ADDRESS = 'Zero address';
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
    event Cancelled();
    event Completed();
    event Fund(uint256 amount);
    event Withdraw(address token, uint256 amount);

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
    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;
    uint256 public remainingFunds;

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
        status = EscrowStatuses.Launched;
        duration = _duration + block.timestamp;
        launcher = _launcher;
        escrowFactory = msg.sender;
        admin = _admin;
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
    ) external override adminOrLauncher notExpired {
        require(_reputationOracle != address(0), 'Invalid reputation oracle');
        require(_recordingOracle != address(0), 'Invalid recording oracle');
        require(_exchangeOracle != address(0), 'Invalid exchange oracle');
        uint256 _totalFeePercentage = _reputationOracleFeePercentage +
            _recordingOracleFeePercentage +
            _exchangeOracleFeePercentage;
        require(_totalFeePercentage <= 100, 'Percentage out of bounds');
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
     * @dev Cancels the escrow and transfers remaining funds to the canceler.
     * @return bool indicating success of the cancellation.
     */
    function cancel()
        public
        override
        adminOrLauncher
        notBroke
        nonReentrant
        returns (bool)
    {
        IERC20(token).safeTransfer(launcher, remainingFunds);
        status = EscrowStatuses.Cancelled;
        remainingFunds = 0;
        emit Cancelled();
        return true;
    }

    /**
     * @dev Withdraws excess funds from the escrow for a specific token.
     * @param _token Address of the token to withdraw.
     * @return bool indicating success of the withdrawal.
     */
    function withdraw(
        address _token
    ) public override adminOrLauncher nonReentrant returns (bool) {
        uint256 _amount;
        if (_token == token) {
            uint256 _balance = getBalance();
            require(_balance > remainingFunds, 'No funds');
            _amount = _balance - remainingFunds;
        } else {
            _amount = getTokenBalance(_token);
        }

        IERC20(_token).safeTransfer(msg.sender, _amount);

        emit Withdraw(_token, _amount);
        return true;
    }

    /**
     * @dev Completes the escrow, transferring remaining funds to the launcher.
     */
    function complete() external override adminOrReputationOracle {
        require(
            status == EscrowStatuses.Paid || status == EscrowStatuses.Partial,
            'Invalid status'
        );
        _complete();
    }

    function _complete() private {
        if (remainingFunds > 0) {
            IERC20(token).safeTransfer(launcher, remainingFunds);
            remainingFunds = 0;
        }
        status = EscrowStatuses.Complete;
        emit Completed();
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
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial,
            'Invalid status'
        );
        require(bytes(_url).length != 0, 'Empty URL');
        require(bytes(_hash).length != 0, 'Empty hash');

        intermediateResultsUrl = _url;

        emit IntermediateStorage(_url, _hash);
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
        _bulkPayOut(_recipients, _amounts, _url, _hash, _txId, forceComplete);
    }

    /**
     * @dev Overloaded function to perform bulk payout with default forceComplete set to false.
     * @param _recipients Array of recipient addresses.
     * @param _amounts Array of amounts to be transferred to each recipient.
     * @param _url URL of the final results.
     * @param _hash Hash of the final results.
     * @param _txId Transaction ID for tracking.
     */
    function bulkPayOut(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _url,
        string calldata _hash,
        uint256 _txId
    ) external {
        _bulkPayOut(_recipients, _amounts, _url, _hash, _txId, false);
    }

    function _bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId,
        bool forceComplete
    ) internal adminOrReputationOracle notBroke notExpired nonReentrant {
        require(_recipients.length == _amounts.length, 'Length mismatch');
        require(_amounts.length > 0, 'Empty amounts');
        require(_recipients.length < BULK_MAX_COUNT, 'Too many recipients');
        require(
            bytes(_url).length != 0 && bytes(_hash).length != 0,
            'Empty url/hash'
        );

        uint256 totalBulkAmount = 0;
        for (uint256 i; i < _recipients.length; ) {
            uint256 amount = _amounts[i];
            require(amount > 0, 'Zero amount');
            totalBulkAmount += amount;
            unchecked {
                ++i;
            }
        }
        require(totalBulkAmount <= remainingFunds, 'Not enough funds');

        uint256 totalReputationOracleFee = 0;
        uint256 totalRecordingOracleFee = 0;
        uint256 totalExchangeOracleFee = 0;
        uint256[] memory netAmounts = new uint256[](_recipients.length + 3);
        address[] memory eventRecipients = new address[](
            _recipients.length + 3
        );
        IERC20 erc20 = IERC20(token);

        for (uint256 i = 0; i < _recipients.length; ) {
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

            netAmounts[i] =
                amount -
                reputationOracleFee -
                recordingOracleFee -
                exchangeOracleFee;
            eventRecipients[i] = _recipients[i];

            erc20.safeTransfer(_recipients[i], netAmounts[i]);
            unchecked {
                ++i;
            }
        }

        if (reputationOracleFeePercentage > 0) {
            erc20.safeTransfer(reputationOracle, totalReputationOracleFee);
            eventRecipients[_recipients.length] = reputationOracle;
            netAmounts[_recipients.length] = totalReputationOracleFee;
        }
        if (recordingOracleFeePercentage > 0) {
            erc20.safeTransfer(recordingOracle, totalRecordingOracleFee);
            eventRecipients[_recipients.length + 1] = recordingOracle;
            netAmounts[_recipients.length + 1] = totalRecordingOracleFee;
        }
        if (exchangeOracleFeePercentage > 0) {
            erc20.safeTransfer(exchangeOracle, totalExchangeOracleFee);
            eventRecipients[_recipients.length + 2] = exchangeOracle;
            netAmounts[_recipients.length + 2] = totalExchangeOracleFee;
        }

        remainingFunds -= totalBulkAmount;

        finalResultsUrl = _url;
        finalResultsHash = _hash;

        bool isPartial = true;
        if (remainingFunds == 0 || forceComplete) {
            isPartial = false;
            _complete();
        } else {
            status = EscrowStatuses.Partial;
        }

        emit BulkTransferV2(
            _txId,
            eventRecipients,
            netAmounts,
            isPartial,
            _url
        );
    }

    modifier adminOrLauncher() {
        require(msg.sender == admin || msg.sender == launcher, 'Unauthorised');
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

    modifier notBroke() {
        require(remainingFunds != 0, 'No funds');
        _;
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Expired');
        _;
    }
}
