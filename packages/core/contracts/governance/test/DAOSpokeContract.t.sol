import "forge-std/Test.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "../src/wormhole/IWormhole.sol";
import "./TestUtil.sol";

pragma solidity ^0.8.20;

contract DAOSpokeContractTest is TestUtil {

    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);

    function setUp() public {
        hmToken = new HMToken(100 ether, "HMToken", 18, "HMT");
        voteToken = new VHMToken(IERC20(address(hmToken)));
        hmToken.approve(address(voteToken), 2 ether);
        voteToken.depositFor(address(this), 2 ether);
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory emptySpokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](0);
        proposers[0] = address(this);
        executors[0] = address(0);
        TimelockController timelockController = new TimelockController(1, proposers, executors, address(this));
        governanceContract = new MetaHumanGovernor(voteToken, timelockController, emptySpokeContracts, 10002, wormholeMockAddress, address(this));
        daoSpokeContract = new DAOSpokeContract(bytes32(uint256(uint160(address(governanceContract)))), 10002, voteToken, 12, spokeChainId, wormholeMockAddress);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](1);
        spokeContracts[0] = CrossChainGovernorCountingSimple.CrossChainAddress(bytes32(uint256(uint160(address(daoSpokeContract)))), 5);
        governanceContract.updateSpokeContracts(spokeContracts);
        bytes memory code = address(governanceContract).code;
        vm.deal(address(daoSpokeContract), 1 ether);
        vm.etch(wormholeMockAddress, code);
        uint256 test = 100;
        vm.mockCall(
            wormholeMockAddress,
            abi.encodeWithSelector(bytes4(keccak256("quoteEVMDeliveryPrice(uint16,uint256,uint256)"))),
            abi.encode(test, test)
        );
        vm.mockCall(
            wormholeMockAddress,
            abi.encodeWithSelector(bytes4(keccak256("sendPayloadToEvm(uint16,address,bytes,uint256,uint256)"))),
            abi.encode(test, test)
        );
    }

    function testHasVotedWhenVoted() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        daoSpokeContract.castVote(proposalId, 0);
        vm.stopPrank();
        bool hasVoted = daoSpokeContract.hasVoted(proposalId, someUser);
        assertTrue(hasVoted);
    }

    function testHasVotedWhenNotVoted() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        bool hasVoted = daoSpokeContract.hasVoted(proposalId, someUser);
        assertFalse(hasVoted);
    }

    function testIsProposalWhenNoProposalsCreated() public {
        bool isProposal = daoSpokeContract.isProposal(1);
        assertFalse(isProposal);
    }

    function testIsProposalWhenProposalCreated() public {
        uint256 proposalId = _createProposalOnSpoke();
        bool isProposal = daoSpokeContract.isProposal(proposalId);
        assertTrue(isProposal);
    }

    function testCastVoteEmitsEvent() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        vm.expectEmit();
        emit VoteCast(someUser, proposalId, 0, 1 ether, "");
        uint256 voteWeight = daoSpokeContract.castVote(proposalId, 0);
        vm.stopPrank();
        assertGt(voteWeight, 0);
    }

    function testCastVoteAgainst() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        uint256 voteWeight = daoSpokeContract.castVote(proposalId, 0);
        vm.stopPrank();
        assertGt(voteWeight, 0);
    }

    function testCastVoteFor() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        uint256 voteWeight = daoSpokeContract.castVote(proposalId, 1);
        vm.stopPrank();
        assertGt(voteWeight, 0);
    }

    function testCastVoteAbstain() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        uint256 voteWeight = daoSpokeContract.castVote(proposalId, 2);
        vm.stopPrank();
        assertGt(voteWeight, 0);
    }

    function testCastVoteInvalidOption() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        vm.expectRevert("DAOSpokeContract: invalid value for enum VoteType");
        daoSpokeContract.castVote(proposalId, 100);
        vm.stopPrank();
    }

    function testCastVoteOnFinishedProposal() public {
        vm.mockCall(
            wormholeMockAddress,
            abi.encodeWithSelector(IWormhole.publishMessage.selector),
            abi.encode(0)
        );

        uint256 proposalId = _createProposalOnSpoke();
        bytes memory message = abi.encode(
            1, // Function selector
            proposalId
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        IWormhole.VM memory mockResult = _createMessageWithPayload(payload);
        //make proposal finished
        _callReceiveMessageOnSpokeWithMock(mockResult);
        //cast vote
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.expectRevert("DAOSpokeContract: vote not currently active");
        vm.startPrank(someUser);
        daoSpokeContract.castVote(proposalId, 1);
        vm.stopPrank();
    }

    function testCastVoteWhenProposalDoesNotExist() public {
        uint256 proposalId = 1;
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.startPrank(someUser);
        vm.expectRevert("DAOSpokeContract: not a started vote");
        daoSpokeContract.castVote(proposalId, 1);
        vm.stopPrank();
    }

    function testCastVoteWhenVoteAlreadyCast() public {
        uint256 proposalId = _createProposalOnSpoke();
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.roll(block.number + 3);
        vm.startPrank(someUser);
        daoSpokeContract.castVote(proposalId, 1);
        vm.expectRevert("DAOSpokeContract: vote already cast");
        daoSpokeContract.castVote(proposalId, 1);
        vm.stopPrank();
    }

    function testReceiveMessageWhenSenderNotHubContract() public {
        uint256 proposalId = 1;
        bytes memory message = abi.encode(
            0, // Function selector
            proposalId,
            block.timestamp // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(msg.sender),
            message
        );
        address someUser = _createMockUserWithVotingPower(1, voteToken);
        vm.expectRevert("Only messages from the hub contract can be received!");
        IWormhole.VM memory mockPayload = _createMessageWithPayload(payload);
        mockPayload.emitterAddress = bytes32(uint256(uint160(address(someUser))));
        _callReceiveMessageOnSpokeWithMock(mockPayload);
    }

    function testReceiveMessageWhenProposalIdNotUnique() public {
        uint256 proposalId = 1;
        bytes memory message = abi.encode(
            0, // Function selector
            proposalId,
            block.timestamp // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        IWormhole.VM memory mockPayload = _createMessageWithPayload(payload);
        _callReceiveMessageOnSpokeWithMock(mockPayload);
        vm.expectRevert("Message already processed");
        _callReceiveMessageOnSpokeWithMock(mockPayload);
    }

    function testReceiveMessageWhenProposalStartBeforeBlockTimestamp() public {
        uint256 proposalId = 1;

        //prepare blockTimestamp and blockNumber
        vm.warp(1000);
        vm.roll(5);

        bytes memory message = abi.encode(
            0, // Function selector
            proposalId,
            block.timestamp - 20 // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        _callReceiveMessageOnSpokeWithMock(_createMessageWithPayload(payload));
        (uint256 localVoteStart, ) = daoSpokeContract.proposals(proposalId);
        assertEq(localVoteStart, block.number - 1);
    }

    function testReceiveMessageWhenProposalStartAfterBlockTimestamp() public {
        uint256 proposalId = 1;

        //prepare blockTimestamp and blockNumber
        vm.warp(1000);
        vm.roll(5);

        bytes memory message = abi.encode(
            0, // Function selector
            proposalId,
            block.timestamp + 20 // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        _callReceiveMessageOnSpokeWithMock(_createMessageWithPayload(payload));
        (uint256 localVoteStart, ) = daoSpokeContract.proposals(proposalId);
        assertEq(localVoteStart, block.number);
    }

    function testReceiveMessageWhenBlockAdjustmentGreaterThanBlockNumber() public {
        uint256 proposalId = 1;

        //prepare blockTimestamp and blockNumber
        vm.warp(1000);
        vm.roll(5);

        bytes memory message = abi.encode(
            0, // Function selector
            proposalId,
            block.timestamp - 200 // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        _callReceiveMessageOnSpokeWithMock(_createMessageWithPayload(payload));
        (uint256 localVoteStart, ) = daoSpokeContract.proposals(proposalId);
        assertEq(localVoteStart, block.number);
    }

    function testReceiveMessageSendingVotesBackToHub() public {
        uint256 proposalId = _createProposalOnSpoke();
        bytes memory message = abi.encode(
            1, // Function selector
            proposalId
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        _callReceiveMessageOnSpokeWithMock(_createMessageWithPayload(payload));
        (, bool voteFinished) = daoSpokeContract.proposals(proposalId);
        assertTrue(voteFinished);
    }
}
