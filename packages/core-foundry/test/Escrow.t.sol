pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/Escrow.sol";
import "./CoreUtils.t.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface EscrowEvents {
    event TrustedHandlerAdded(address _handler);
    event IntermediateStorage(string _url, string _hash);
    event Pending(string manifest, string hash);
    event BulkTransfer(uint256 indexed _txId, address[] _recipients, uint256[] _amounts, bool _isPartial);
    event Cancelled();
    event Completed();
}

contract EscrowTest is CoreUtils, EscrowEvents {
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
        vm.startPrank(trustedHandlers[0]);
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

    function 
}
