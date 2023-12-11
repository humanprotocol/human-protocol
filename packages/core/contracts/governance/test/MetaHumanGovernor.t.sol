import "forge-std/Test.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "../src/wormhole/IWormholeRelayer.sol";
import "./TestUtil.sol";

pragma solidity ^0.8.20;

contract MetaHumanGovernorTest is TestUtil, EIP712 {

    constructor()
    EIP712("MetaHumanGovernor", "1")//done for vote with signature tests
    {}

    TimelockController public timelockController;

    function setUp() public {
        hmToken = new HMToken(100 ether, "HMToken", 18, "HMT");
        voteToken = new VHMToken(IERC20(address(hmToken)));
        hmToken.approve(address(voteToken), 10 ether);
        voteToken.depositFor(address(this), 10 ether);
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(this);
        executors[0] = address(0);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory emptySpokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](0);
        timelockController = new TimelockController(1, proposers, executors, address(this));
        governanceContract = new MetaHumanGovernor(voteToken, timelockController, emptySpokeContracts, 0, wormholeMockAddress, address(this));
        daoSpokeContract = new DAOSpokeContract(bytes32(uint256(uint160(address(governanceContract)))), hubChainId, voteToken, 12, spokeChainId, wormholeMockAddress);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](1);
        spokeContracts[0] = CrossChainGovernorCountingSimple.CrossChainAddress(bytes32(uint256(uint160(address(daoSpokeContract)))), spokeChainId);
        governanceContract.updateSpokeContracts(spokeContracts);
        timelockController.grantRole(keccak256("PROPOSER_ROLE"), address(governanceContract));
        timelockController.revokeRole(keccak256("TIMELOCK_ADMIN_ROLE"), address(this));
        bytes memory code = address(daoSpokeContract).code;
        vm.deal(address(governanceContract), 1 ether);
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

    function testUpdateSpokeContracts() public {
        DAOSpokeContract newlyDeployedSpoke = new DAOSpokeContract(bytes32(uint256(uint160(address(governanceContract)))), hubChainId, voteToken, 12, spokeChainId, wormholeMockAddress);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](1);
        spokeContracts[0] = CrossChainGovernorCountingSimple.CrossChainAddress(bytes32(uint256(uint160(address(newlyDeployedSpoke)))), spokeChainId);
        governanceContract.updateSpokeContracts(spokeContracts);
        assertTrue(governanceContract.spokeContractsMapping(bytes32(uint256(uint160(address(newlyDeployedSpoke)))), spokeChainId));
    }

    function testCannotUpdateSpokeContractsAfterTransferringOwnership() public {
        DAOSpokeContract newlyDeployedSpoke = new DAOSpokeContract(bytes32(uint256(uint160(address(governanceContract)))), hubChainId, voteToken, 12, spokeChainId, wormholeMockAddress);
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](1);
        spokeContracts[0] = CrossChainGovernorCountingSimple.CrossChainAddress(bytes32(uint256(uint160(address(newlyDeployedSpoke)))), spokeChainId);
        governanceContract.transferOwnership(address(timelockController));
        vm.expectRevert("Ownable: caller is not the owner");
        governanceContract.updateSpokeContracts(spokeContracts);
    }

    function testGrantProposalCreation() public {
        uint256 proposalId = _createBasicProposal();
        assertGt(proposalId, 0);
    }

    function testCrossChainGrantProposalCreation() public {
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(this), 50));
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(voteToken);
        calldatas[0] = encodedCall;

        governanceContract.crossChainPropose(targets, values, calldatas, "");
    }

    function testCrossChainProposeWhenSpokesEmpty() public {
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](0);
        governanceContract.updateSpokeContracts(spokeContracts);
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(this), 50));
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(voteToken);
        calldatas[0] = encodedCall;

        governanceContract.crossChainPropose(targets, values, calldatas, "");
        assert(governanceContract.nonce() == 0);//no messages emitted
    }

    function testCrossChainProposeWhenNotMagistrate() public {
        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](0);
        governanceContract.updateSpokeContracts(spokeContracts);
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(this), 50));
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(voteToken);
        calldatas[0] = encodedCall;

        address someUser = _createMockUserWithVotingPower(1, voteToken);

        vm.startPrank(someUser);
        vm.expectRevert("Magistrate: caller is not the magistrate");
        governanceContract.crossChainPropose(targets, values, calldatas, "");
        vm.stopPrank();
    }

    function testVoteOnProposal() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnProposalWhenNotActive() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("Governor: vote not currently active");
        governanceContract.castVote(proposalId, 1);
    }

    function testVoteOnAgainst() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 0);
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 1 ether);
        assertEq(forVotes, 0 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnAbstain() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 2);
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0 ether);
        assertEq(forVotes, 0 ether);
        assertEq(abstainVotes, 1 ether);
    }

    function testVoteOnInvalidValue() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("GovernorVotingSimple: invalid value for enum VoteType");
        governanceContract.castVote(proposalId, 5);
        vm.stopPrank();
    }

    function testVoteWhenVoteAlreadyCast() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 1);
        vm.expectRevert("GovernorVotingSimple: vote already cast");
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();
    }

    function testCOUNTING_MODE() public {
        string memory countingMode = governanceContract.COUNTING_MODE();
        assertEq(countingMode, "support=bravo&quorum=for,abstain");
    }

    function testHasVotedWhenVoteNotCast() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        assertFalse(governanceContract.hasVoted(proposalId, someUser));
    }

    function testHasVotedWhenVoteCast() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        vm.roll(block.number + 2);

        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        assertTrue(governanceContract.hasVoted(proposalId, someUser));
    }

    function testCrossChainVoteOnProposal() public {
        //create proposal
        vm.roll(block.number + 1);
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUser(1);
        voteToken.transfer(someUser, 1 ether);
        vm.startPrank(someUser);
        voteToken.delegate(someUser);

        vm.roll(block.number + 10);

        //vote collection message
        bytes memory message = abi.encode(
            0,
            proposalId,
            1 ether,
            0,
            0
        );
        bytes memory payload = abi.encode(
            address(governanceContract),
            spokeChainId,
            address(daoSpokeContract),
            message
        );
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testExecuteProposal() public {
        //create proposal
        address someUser = _createMockUser(1);
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(someUser), 1 ether));
        hmToken.transfer(address(timelockController), 1 ether);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(hmToken);
        calldatas[0] = encodedCall;
        uint256 proposalId = governanceContract.crossChainPropose(targets, values, calldatas, utilDescription);
        //mock account with voting power
        voteToken.transfer(someUser, 5 ether);
        vm.startPrank(someUser);
        voteToken.delegate(someUser);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        //wait for voting to end
        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
        _collectVotesFromSpoke(proposalId);
        governanceContract.queue(targets, values, calldatas, keccak256(bytes(utilDescription)));
        vm.warp(block.timestamp + 10);
        uint256 balanceBeforeExecution = hmToken.balanceOf(someUser);
        governanceContract.execute(targets, values, calldatas, keccak256(bytes(utilDescription)));
        uint256 balanceAfterExecution = hmToken.balanceOf(someUser);
        assertGt(balanceAfterExecution, balanceBeforeExecution);
    }

    function testQueueProposalWhenCollectionPhaseUnfinished() public {
        //create proposal
        address someUser = _createMockUser(1);
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(someUser), 1 ether));
        hmToken.transfer(address(timelockController), 1 ether);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(hmToken);
        calldatas[0] = encodedCall;
        uint256 proposalId = governanceContract.crossChainPropose(targets, values, calldatas, utilDescription);
        //mock account with voting power
        voteToken.transfer(someUser, 5 ether);
        vm.startPrank(someUser);
        voteToken.delegate(someUser);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        //wait for voting to end
        vm.roll(block.number + 50410);
        vm.expectRevert("Governor: proposal not successful");
        governanceContract.queue(targets, values, calldatas, keccak256(bytes(utilDescription)));
    }

    function testExecuteProposalWhenCollectionPhaseUnfinished() public {
        //create proposal
        address someUser = _createMockUser(1);
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(someUser), 1 ether));
        hmToken.transfer(address(timelockController), 1 ether);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(hmToken);
        calldatas[0] = encodedCall;
        uint256 proposalId = governanceContract.crossChainPropose(targets, values, calldatas, utilDescription);
        //mock account with voting power
        voteToken.transfer(someUser, 5 ether);
        vm.startPrank(someUser);
        voteToken.delegate(someUser);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        //wait for voting to end
        vm.roll(block.number + 50410);
        vm.expectRevert("Governor: proposal not successful");
        governanceContract.execute(targets, values, calldatas, keccak256(bytes(utilDescription)));
    }


    function testGetVotingDelay() public {
        uint256 votingDelay = governanceContract.votingDelay();
        assertEq(votingDelay, 1);//1 is just taken from MetaHumanGovernor.sol constructor (GovernorSettings)
    }

    function testGetVotingPeriod() public {
        uint256 votingPeriod = governanceContract.votingPeriod();
        assertEq(votingPeriod, 20 * 15);//5 is just taken from MetaHumanGovernor.sol constructor (GovernorSettings)
    }

    function testGetQuorum() public {
        vm.roll(block.number + 3);
        uint256 quorum = governanceContract.quorum(block.number - 1);
        assertEq(quorum, 0.4 ether);
    }

    function testGetProposalState() public {
        uint256 proposalId = _createBasicProposal();

        IGovernor.ProposalState state = governanceContract.state(proposalId);
        IGovernor.ProposalState expectedState = IGovernor.ProposalState.Pending;
        assert(state == expectedState);
    }

    function testGetProposalStateWhenNotSucceededAndCollectionNotFinished() public {
        uint256 proposalId = _createBasicProposal();

        vm.roll(block.number + 50410);

        IGovernor.ProposalState state = governanceContract.state(proposalId);
        IGovernor.ProposalState expectedState = IGovernor.ProposalState.Pending;
        assert(state == expectedState);
    }

    function testGetProposalStateWhenSucceededAndCollectionNotFinished() public {
        uint256 proposalId = _createBasicProposal();

        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        vm.roll(block.number + 50410);

        IGovernor.ProposalState state = governanceContract.state(proposalId);
        IGovernor.ProposalState expectedState = IGovernor.ProposalState.Pending;
        assert(state == expectedState);
    }

    function testGetProposalStateWhenSucceededAndCollectionFinished() public {
        uint256 proposalId = _createBasicProposal();

        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 1);
        vm.stopPrank();

        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
        _collectVotesFromSpoke(proposalId);

        IGovernor.ProposalState state = governanceContract.state(proposalId);
        IGovernor.ProposalState expectedState = IGovernor.ProposalState.Succeeded;
        assert(state == expectedState);
    }

    function testGetProposalStateWhenDefeatedAndCollectionFinished() public {
        uint256 proposalId = _createBasicProposal();

        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVote(proposalId, 0);
        vm.stopPrank();

        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
        _collectVotesFromSpoke(proposalId);

        IGovernor.ProposalState state = governanceContract.state(proposalId);
        IGovernor.ProposalState expectedState = IGovernor.ProposalState.Defeated;
        assert(state == expectedState);
    }

    function testGetProposalThreshold() public {
        uint256 proposalThreshold = governanceContract.proposalThreshold();
        assertEq(proposalThreshold, 0);//0 is just taken from MetaHumanGovernor.sol constructor (GovernorSettings)
    }

    function testSupportsInterfaceIGovernor() public {
        bool supportsInterface = governanceContract.supportsInterface(type(IGovernor).interfaceId);
        assertTrue(supportsInterface);
    }

    function testSupportsInterfaceIERC1155Receiver() public {
        bool supportsInterface = governanceContract.supportsInterface(type(IERC1155Receiver).interfaceId);
        assertTrue(supportsInterface);
    }

    function testSupportsInterfaceIGovernorTimelock() public {
        bool supportsInterface = governanceContract.supportsInterface(type(IGovernorTimelock).interfaceId);
        assertTrue(supportsInterface);
    }

    function testReceiveMessageWhenSenderIsNotSpokeContract() public {
        bytes memory message = abi.encode(
            0,
            1, //proposalId
            1 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        vm.expectRevert("Only messages from the spoke contracts can be received!");
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload));
    }

    function testReceiveMessageWhenVotesAlreadyCount() public {
        bytes memory message = abi.encode(
            0,
            1, //proposalId
            1 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        //different result, so hash of Wormhole message will be different
        bytes memory message2 = abi.encode(
            0,
            1, //proposalId
            2 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        bytes memory payload = abi.encode(
            address(governanceContract),
            hubChainId,
            address(daoSpokeContract),
            message
        );
        bytes memory payload2 = abi.encode(
            address(governanceContract),
            hubChainId,
            address(daoSpokeContract),
            message2
        );
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
        vm.expectRevert("Already initialized!");
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload2, spokeChainId, address(daoSpokeContract)));
    }

    function testReceiveMessage() public {
        uint256 proposalId = _createBasicProposal();
        bytes memory message = abi.encode(
            0,
            proposalId, //proposalId
            1 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        bytes memory payload = abi.encode(
            address(governanceContract),
            hubChainId,
            address(daoSpokeContract),
            message
        );
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
    }

    function testReceiveMessageWhenMessageAlreadyReceived() public {
        uint256 proposalId = _createBasicProposal();
        bytes memory message = abi.encode(
            0,
            proposalId, //proposalId
            1 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        bytes memory payload = abi.encode(
            address(governanceContract),
            hubChainId,
            address(daoSpokeContract),
            message
        );
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
        vm.expectRevert("Message already processed");
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
    }

    function testReceiveMessageWhenIntendedRecipientDifferent() public {
        uint256 proposalId = _createBasicProposal();
        bytes memory message = abi.encode(
            0,
            proposalId, //proposalId
            1 ether, //forVotes
            2 ether, //againstVotes
            3 ether //abstainVotes
        );
        bytes memory payload = abi.encode(
            address(this),
            hubChainId,
            address(daoSpokeContract),
            message
        );
        vm.expectRevert();
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
    }

    function testFinishCollectionPhase() public {
        uint256 proposalId = _createBasicProposal();
        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
        _collectVotesFromSpoke(proposalId);
        bool collectionFinished = governanceContract.collectionFinished(proposalId);
        assertTrue(collectionFinished);
    }

    function testRequestCollections() public {
        uint256 proposalId = _createBasicProposal();
        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
    }

    function testRequestCollectionsWhenVotingPeriodNotOver() public {
        uint256 proposalId = _createBasicProposal();
        vm.roll(block.number + 2);
        vm.expectRevert("Cannot request for vote collection until after the vote period is over!");
        governanceContract.requestCollections(proposalId);
    }

    function testRequestCollectionsWhenCollectionAlreadyStarted() public {
        uint256 proposalId = _createBasicProposal();
        vm.roll(block.number + 50410);
        governanceContract.requestCollections(proposalId);
        vm.expectRevert("Collection phase for this proposal has already started!");
        governanceContract.requestCollections(proposalId);
    }

    function testVoteOnProposalWithReason() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVoteWithReason(proposalId, 1, "test reason");
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnProposalWithReasonWhenVoteNotActive() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("Governor: vote not currently active");
        governanceContract.castVoteWithReason(proposalId, 1, "test reason");
        vm.stopPrank();
    }

    function testVoteOnProposalWithReasonAndParams() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVoteWithReasonAndParams(proposalId, 1, "test reason", "test params");
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnProposalWithReasonAndParamsWhenNotActive() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        address someUser = _createMockUserWithVotingPower(1, voteToken);

        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("Governor: vote not currently active");
        governanceContract.castVoteWithReasonAndParams(proposalId, 1, "test reason", "test params");
        vm.stopPrank();
    }

    function testVoteOnProposalBySig() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        uint256 privateKeySeed = 1;
        address someUser = _createMockUserWithVotingPower(privateKeySeed, voteToken);

        //create signature
        uint8 support = 1;

        bytes32 hash = _getHashToSignProposal(proposalId, support);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKeySeed, hash);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVoteBySig(proposalId, support, v, r, s);
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnProposalBySigWhenNotActive() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        uint256 privateKeySeed = 1;
        address someUser = _createMockUserWithVotingPower(privateKeySeed, voteToken);

        //create signature
        uint8 support = 1;

        bytes32 hash = _getHashToSignProposal(proposalId, support);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKeySeed, hash);

        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("Governor: vote not currently active");
        governanceContract.castVoteBySig(proposalId, support, v, r, s);
        vm.stopPrank();
    }

    function testVoteOnProposalWithReasonAndParamsBySig() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        uint256 privateKeySeed = 1;
        address someUser = _createMockUserWithVotingPower(privateKeySeed, voteToken);

        //create signature
        uint8 support = 1;
        bytes memory params = "test params";
        bytes32 hash = _getHashToSignProposalWithReasonAndParams(proposalId, support, "test reason", params);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKeySeed, hash);

        //wait for next block
        vm.roll(block.number + 2);
        //cast vote
        vm.startPrank(someUser);
        governanceContract.castVoteWithReasonAndParamsBySig(proposalId, support, "test reason", params, v, r, s);
        vm.stopPrank();

        //assert votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governanceContract.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 1 ether);
        assertEq(abstainVotes, 0);
    }

    function testVoteOnProposalWithReasonAndParamsBySigWhenNotActive() public {
        //create proposal
        uint256 proposalId = _createBasicProposal();
        //mock account with voting power
        uint256 privateKeySeed = 1;
        address someUser = _createMockUserWithVotingPower(privateKeySeed, voteToken);

        //create signature
        uint8 support = 1;
        bytes memory params = "test params";
        bytes32 hash = _getHashToSignProposalWithReasonAndParams(proposalId, support, "test reason", params);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKeySeed, hash);

        //cast vote
        vm.startPrank(someUser);
        vm.expectRevert("Governor: vote not currently active");
        governanceContract.castVoteWithReasonAndParamsBySig(proposalId, support, "test reason", params, v, r, s);
        vm.stopPrank();
    }

    function testCannotCreateProposalWithPropose() public {
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(this), 1 ether));
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(voteToken);
        calldatas[0] = encodedCall;

        vm.expectRevert("Please use crossChainPropose instead.");
        governanceContract.propose(targets, values, calldatas, "test");
    }

    function testMagistrateGetter() public view {
        address magistrate = governanceContract.magistrate();
        assert(magistrate == address(this));
    }

    function testMagistrateTransfer() public {
        governanceContract.transferMagistrate(address(1));
        address magistrate = governanceContract.magistrate();
        assert(magistrate == address(1));
    }

    function testMagistrateTransferWhenNewMagistrateIsZeroAddress() public {
        vm.expectRevert("Magistrate: new magistrate is the zero address");
        governanceContract.transferMagistrate(address(0));
    }
}
