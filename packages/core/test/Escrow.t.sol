pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/Escrow.sol";
import "./CoreUtils.t.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/utils/SafeMath.sol";

interface EscrowEvents {
    event TrustedHandlerAdded(address _handler);
    event IntermediateStorage(string _url, string _hash);
    event Pending(string manifest, string hash);
    event BulkTransfer(uint256 indexed _txId, address[] _recipients, uint256[] _amounts, bool _isPartial);
    event Cancelled();
    event Completed();
}

contract EscrowTest is CoreUtils, EscrowEvents {
    using SafeMath for uint256;

    Escrow public escrow;
    HMToken public hmToken;

    enum Status {
        Launched,
        Pending,
        Partial,
        Paid,
        Complete,
        Cancelled
    }

    string constant MOCK_URL = "http://google.com/fake";
    string constant MOCK_HASH = "kGKmnj9BRf";

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');
        _initTrustedHandlers();
        escrow = new Escrow(address(hmToken), launcher, payable(owner), 100, trustedHandlers);
        vm.stopPrank();
    }

    function testSetUpEscrow() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        assertEq(escrow.reputationOracle(), reputationOracle, "Reputation oracle address is not the same");
        assertEq(escrow.recordingOracle(), recordingOracle, "Recording oracle address is not the same");
        assertEq(escrow.exchangeOracle(), exchangeOracle, "Exchange oracle address is not the same");
        assertEq(escrow.reputationOracleFeePercentage(), 10, "Reputation oracle fee is not the same");
        assertEq(escrow.recordingOracleFeePercentage(), 10, "Recording oracle fee is not the same");
        assertEq(escrow.exchangeOracleFeePercentage(), 10, "Exchange oracle fee is not the same");
        assertEq(escrow.manifestUrl(), MOCK_URL, "URL is not the same");
        assertEq(escrow.manifestHash(), MOCK_HASH, "Hash is not the same");
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Pending), "Escrow status is not Pending");
    }

    function testFundEscrow() public {
        vm.startPrank(owner);
        uint256 amount = 20;
        uint256 balanceBefore = hmToken.balanceOf(address(escrow));
        hmToken.approve(address(escrow), 30);
        hmToken.transfer(address(escrow), amount);
        uint256 balanceAfter = hmToken.balanceOf(address(escrow));
        assertEq(balanceAfter - balanceBefore, amount, "Escrow didn't receive tokens");
        vm.stopPrank();
    }

    function testRightTokenAddress() public {
        assertEq(address(escrow.token()), address(hmToken), "Escrow token address is not the same as HMToken");
    }

    function testRightStatus() public {
        vm.prank(launcher); // should be a trustedHandler (owner also works)
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Launched), "Escrow status is not Launched");
    }

    function testRightEscrowBalance() public {
        uint256 balance = hmToken.balanceOf(address(escrow));
        assertEq(balance, 0, "Escrow balance is not 0");
    }

    function testRightContractCreator() public {
        assertEq(escrow.launcher(), launcher, "Escrow creator is not the same as owner");
    }

    function testRightEscrowFactoryContract() public {
        assertEq(escrow.escrowFactory(), owner, "Escrow factory is not the same as owner");
    }

    function testFail_NoTrustedAddress() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.abort();
    }

    function testFail_AbortingFromReputationOracle() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(reputationOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.abort();
    }

    function testFail_AbortingFromRecordingOracle() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(recordingOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.abort();
    }

    function testTransferToOwnerIfAbortedByOwner() public {
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        uint256 ownerInitialBalance = hmToken.balanceOf(owner);
        hmToken.approve(address(escrow), 100);
        hmToken.transfer(address(escrow), 100);
        escrow.abort();
        uint256 balanceEscrow = hmToken.balanceOf(address(escrow));
        uint256 balanceOwner = hmToken.balanceOf(owner);
        assertEq(balanceEscrow, 0);
        assertEq(balanceOwner, ownerInitialBalance);
        vm.stopPrank();
    }

    function testTransferToOwnerIfAbortedTrustedHandler() public {
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        uint256 ownerInitialBalance = hmToken.balanceOf(owner);
        hmToken.approve(address(escrow), 100);
        hmToken.transfer(address(escrow), 100);
        vm.stopPrank();
        _initTrustedHandlers();
        vm.prank(trustedHandlers[0]);
        escrow.abort();
        uint256 balanceEscrow = hmToken.balanceOf(address(escrow));
        uint256 balanceOwner = hmToken.balanceOf(owner);
        assertEq(balanceEscrow, 0);
        assertEq(balanceOwner, ownerInitialBalance);
    }

    function testFail_callerCannotAddTrustedHandler() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        address[] memory newTrustedHandlers = new address[](1);
        escrow.addTrustedHandlers(newTrustedHandlers);
        vm.prank(reputationOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.addTrustedHandlers(newTrustedHandlers);
        vm.prank(recordingOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.addTrustedHandlers(newTrustedHandlers);
    }

    function testAddTrustedHandlersByOwner() public {
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        restAccounts[0] = vm.addr(7);
        restAccounts[1] = vm.addr(8);
        escrow.addTrustedHandlers(restAccounts);
        vm.stopPrank();
        vm.prank(restAccounts[1]);
        escrow.storeResults(MOCK_URL, MOCK_HASH);
    }

    function testAddTrustedHandlers() public {
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        _initTrustedHandlers();
        vm.prank(trustedHandlers[0]);
        escrow.addTrustedHandlers(trustedHandlers);
    }

    // Store results
    function testFail_StoreResultWrongCaller() public {
        // Caller is externalAddress
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.storeResults(MOCK_URL, MOCK_HASH);

        // Caller is reputationOracle
        vm.prank(reputationOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.storeResults(MOCK_URL, MOCK_HASH);
    }

    // TO DO :

    // function testFail_EscrowStatusPendingOrPartial() public {
    //     vm.startPrank(owner);
    //     escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
    //     _initTrustedHandlers();
    //     escrow.addTrustedHandlers(reputationOracle);
    //     vm.stopPrank();
    //     vm.prank(reputationOracle);
    //     vm.expectRevert(bytes("ESCROW_STATUS_NOT_PENDING_OR_PARTIAL"));
    //     escrow.storeResults(MOCK_URL, MOCK_HASH);
    // }

    // Events
    function testEmitEventIntermediateStorage() public {
        vm.startPrank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.expectEmit();
        emit IntermediateStorage(MOCK_URL, MOCK_HASH);
        //Perform the call
        escrow.storeResults(MOCK_URL, MOCK_HASH);
        vm.stopPrank();
    }

    function testStoreResults() public {
        vm.prank(owner);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        // Recording Oracle stores results
        vm.startPrank(recordingOracle);
        vm.expectEmit();
        emit IntermediateStorage(MOCK_URL, MOCK_HASH);
        escrow.storeResults(MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        // Trusted Handler stores results
        vm.startPrank(owner);
        _initTrustedHandlers();
        escrow.addTrustedHandlers(trustedHandlers);
        vm.stopPrank();
        vm.startPrank(trustedHandlers[0]);
        vm.expectEmit();
        emit IntermediateStorage(MOCK_URL, MOCK_HASH);
        escrow.storeResults(MOCK_URL, MOCK_HASH);
        vm.stopPrank();
    }

    function testFail_SetupEscrowWrongCaller() public {
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
    }

    function testFail_InvalidReputationOracle() public {
        vm.prank(owner);
        vm.expectRevert(bytes("INVALID_REPUTATION_ORACLE_ADDRESS"));
        escrow.setup(address(0), recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
    }

    function testFail_InvalidExchangeOracle() public {
        vm.prank(owner);
        vm.expectRevert(bytes("INVALID_EXCHANGE_ORACLE_ADDRESS"));
        escrow.setup(reputationOracle, recordingOracle, address(0), 10, 10, 10, MOCK_URL, MOCK_HASH);
    }

    function testFail_FeePercentageOutOfBound() public {
        vm.prank(owner);
        vm.expectRevert(bytes("FEE_PERCENTAGE_OUT_OF_BOUND"));
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 40, 40, 40, MOCK_URL, MOCK_HASH);
    }

    function testEmitEventOnPending() public {
        vm.startPrank(owner);
        vm.expectEmit();
        emit Pending(MOCK_URL, MOCK_HASH);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
    }

    function setUpEscrowByTrustHandlers() public {
        vm.startPrank(owner);
        _initTrustedHandlers();
        escrow.addTrustedHandlers(trustedHandlers);
        vm.stopPrank();
        _initTrustedHandlers();
        vm.startPrank(trustedHandlers[0]);
        vm.expectEmit();
        emit Pending(MOCK_URL, MOCK_HASH);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        assertEq(escrow.reputationOracle(), reputationOracle, "Reputation oracle address is not the same");
        assertEq(escrow.recordingOracle(), recordingOracle, "Recording oracle address is not the same");
        assertEq(escrow.exchangeOracle(), exchangeOracle, "Exchange oracle address is not the same");
        assertEq(escrow.manifestUrl(), MOCK_URL, "URL is not the same");
        assertEq(escrow.manifestHash(), MOCK_HASH, "Hash is not the same");
        vm.stopPrank();
    }

    function testFail_CancelWithInvalidCaller() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.cancel();
        vm.prank(reputationOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.cancel();
        vm.prank(recordingOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.cancel();
    }

    function testCancelEscrowByOwner() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        vm.prank(owner);
        escrow.cancel();
        uint256 balanceEscrow = hmToken.balanceOf(address(escrow));
        assertEq(balanceEscrow, 0);
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Cancelled));
    }

    function testCancelEscrowByTrustedHandler() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        _initTrustedHandlers();
        vm.startPrank(trustedHandlers[0]);
        escrow.cancel();
        uint256 balanceEscrow = hmToken.balanceOf(address(escrow));
        assertEq(balanceEscrow, 0);
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Cancelled));
    }

    function testFail_BulkPayoutByNotTrustedCaller() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 10;
        _initTrustedHandlers();
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.bulkPayOut(restAccounts, amounts, MOCK_URL, MOCK_HASH, 0);
        vm.prank(recordingOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.bulkPayOut(restAccounts, amounts, MOCK_URL, MOCK_HASH, 0);
    }

    function testFail_RecipientsMoreThanValues() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        vm.prank(reputationOracle);
        address[] memory recipients;
        recipients[0] = vm.addr(7);
        recipients[1] = vm.addr(8);
        recipients[2] = vm.addr(9);
        uint256[] memory amounts;
        amounts[0] = 10;
        amounts[1] = 20;
        vm.expectRevert(bytes("RECIPIENTS AND VALUES DO NOT MATCH"));
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
    }

    function testFail_ValuesMoreThanRecipients() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();
        vm.prank(reputationOracle);
        address[] memory recipients;
        recipients[0] = vm.addr(7);
        recipients[1] = vm.addr(8);
        uint256[] memory amounts;
        amounts[0] = 10;
        amounts[1] = 20;
        amounts[2] = 30;
        vm.expectRevert(bytes("RECIPIENTS AND VALUES DO NOT MATCH"));
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
    }

    function testFail_TooManyRecipients() public {
        // Should fail with too many recipients
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.prank(reputationOracle);
        // Loops through 100 recipients
        (address[] memory recipients, uint256[] memory amounts) = _initRecipientsAndAmounts(100);
        vm.expectRevert(bytes("TOO_MANY_RECIPIENTS"));
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
    }

    function testEmitOnBulkTransfer() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 1000);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        restAccounts[0] = vm.addr(44);
        restAccounts[1] = vm.addr(45);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 7;
        amounts[1] = 200; // 30% (FeePercentages) fee on 200 = 60 (200-60 = 140)
        uint256 feeReduction = (amounts[1].mul(100 - 30));
        uint256 amountToTransfer = feeReduction.div(100);
        uint256[] memory expectedAmountTransfered = new uint256[](2);
        expectedAmountTransfered[0] = 7;
        expectedAmountTransfered[1] = amountToTransfer;
        vm.expectEmit();
        emit BulkTransfer(0, restAccounts, expectedAmountTransfered, true);
        escrow.bulkPayOut(restAccounts, amounts, MOCK_URL, MOCK_HASH, 0);
        vm.stopPrank();
    }

    function testBulkPayoutForRecipients() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 1000);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);

        address[] memory recipients = new address[](3);
        recipients[0] = vm.addr(19);
        recipients[1] = vm.addr(20);
        recipients[2] = vm.addr(21);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10;
        amounts[1] = 20;
        amounts[2] = 30;

        uint256 initialBalanceRecipient1 = hmToken.balanceOf(recipients[0]);
        uint256 initialBalanceRecipient2 = hmToken.balanceOf(recipients[1]);
        uint256 initialBalanceRecipient3 = hmToken.balanceOf(recipients[2]);
        uint256 initialBalanceRecordingOracle = hmToken.balanceOf(recordingOracle);
        uint256 initialBalanceReputationOracle = hmToken.balanceOf(reputationOracle);
        uint256 initialBalanceExchangeOracle = hmToken.balanceOf(exchangeOracle);
        vm.stopPrank();

        vm.prank(reputationOracle);
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
        uint256[] memory amountsWithFees = new uint256[](3);
        amountsWithFees[0] = amounts[0].mul(100 - 30).div(100);
        amountsWithFees[1] = amounts[1].mul(100 - 30).div(100);
        amountsWithFees[2] = amounts[2].mul(100 - 30).div(100);
        uint256 oracleReceivedAmount = (amounts[0] + amounts[1] + amounts[2]).mul(10).div(100); // 10% for each oracle

        uint256 finalBalanceRecipient1 = hmToken.balanceOf(recipients[0]);
        uint256 finalBalanceRecipient2 = hmToken.balanceOf(recipients[1]);
        uint256 finalBalanceRecipient3 = hmToken.balanceOf(recipients[2]);
        uint256 finalBalanceRecordingOracle = hmToken.balanceOf(recordingOracle);
        uint256 finalBalanceReputationOracle = hmToken.balanceOf(reputationOracle);
        uint256 finalBalanceExchangeOracle = hmToken.balanceOf(exchangeOracle);

        assertEq(
            finalBalanceRecipient1 - initialBalanceRecipient1,
            amountsWithFees[0],
            "Recipient 1 didn't receive the correct amount"
        );
        assertEq(
            finalBalanceRecipient2 - initialBalanceRecipient2,
            amountsWithFees[1],
            "Recipient 2 didn't receive the correct amount"
        );
        assertEq(
            finalBalanceRecipient3 - initialBalanceRecipient3,
            amountsWithFees[2],
            "Recipient 3 didn't receive the correct amount"
        );
        assertEq(
            finalBalanceRecordingOracle - initialBalanceRecordingOracle,
            oracleReceivedAmount,
            "Recording Oracle didn't receive the correct amount"
        );
        assertEq(
            finalBalanceReputationOracle - initialBalanceReputationOracle,
            oracleReceivedAmount,
            "Reputation Oracle didn't receive the correct amount"
        );
        assertEq(
            finalBalanceExchangeOracle - initialBalanceExchangeOracle,
            oracleReceivedAmount,
            "Exchange Oracle didn't receive the correct amount"
        );
    }

    function testFromSetupToBulkPay() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        address[] memory recipients = new address[](1);
        recipients[0] = vm.addr(44);
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100;

        // Check status of Escrow
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Pending), "Escrow status is not Pending");
        vm.stopPrank();

        vm.startPrank(reputationOracle);
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
        uint256 statusAfterPayout = uint256(escrow.status());
        assertEq(statusAfterPayout, uint256(Status.Paid), "Escrow status is not Paid");
        escrow.complete();
        uint256 statusAfterComplete = uint256(escrow.status());
        assertEq(statusAfterComplete, uint256(Status.Complete), "Escrow status is not Complete");
    }

    function testFromSetupToBulkPayOutMultipleAddresses() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 1000);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        address[] memory recipients = new address[](3);
        recipients[0] = vm.addr(44);
        recipients[1] = vm.addr(45);
        recipients[2] = vm.addr(46);
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 200;
        amounts[1] = 400;
        amounts[2] = 400;

        // Check status of Escrow
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Pending), "Escrow status is not Pending");
        vm.stopPrank();

        vm.startPrank(reputationOracle);
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
        uint256 statusAfterPayout = uint256(escrow.status());
        assertEq(statusAfterPayout, uint256(Status.Paid), "Escrow status is not Paid");
        escrow.complete();
        uint256 statusAfterComplete = uint256(escrow.status());
        assertEq(statusAfterComplete, uint256(Status.Complete), "Escrow status is not Complete");
    }

    function testFail_CompleteValidations() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 1000);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        vm.stopPrank();

        // External Address
        vm.prank(externalAddress);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.complete();

        // Recording Oracle
        vm.prank(recordingOracle);
        vm.expectRevert(bytes("ADDRESS_CALLING_NOT_TRUSTED"));
        escrow.complete();

        // Not right status
        vm.prank(owner);
        vm.expectRevert(bytes("ESCROW_STATUS_NOT_PAID"));
        escrow.complete();
    }

    function testCompleteEscrowByLauncher() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        address[] memory recipients = new address[](1);
        recipients[0] = vm.addr(44);
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100;

        // Completed by Launcher
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
        escrow.complete();
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Complete), "Escrow status is Complete");
        vm.stopPrank();
    }

    function testCompleteEscrowByTrustedHandler() public {
        vm.startPrank(owner);
        hmToken.transfer(address(escrow), 100);
        escrow.setup(reputationOracle, recordingOracle, exchangeOracle, 10, 10, 10, MOCK_URL, MOCK_HASH);
        address[] memory recipients = new address[](1);
        recipients[0] = vm.addr(44);
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100;

        // Completed by Trusted Handler
        escrow.bulkPayOut(recipients, amounts, MOCK_URL, MOCK_HASH, 0);
        vm.stopPrank();
        _initTrustedHandlers();
        vm.startPrank(trustedHandlers[0]);
        escrow.complete();
        uint256 status = uint256(escrow.status());
        assertEq(status, uint256(Status.Complete), "Escrow status is Complete");
        vm.stopPrank();
    }
}
