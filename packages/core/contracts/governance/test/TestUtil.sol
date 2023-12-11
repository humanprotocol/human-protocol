import "forge-std/Test.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "../src/MetaHumanGovernor.sol";
import "../src/wormhole/IWormhole.sol";

pragma solidity ^0.8.20;

abstract contract TestUtil is Test {

    MetaHumanGovernor public governanceContract;
    DAOSpokeContract public daoSpokeContract;
    HMToken public hmToken;
    VHMToken public voteToken;
    address public wormholeMockAddress = address(100);
    uint16 public spokeChainId = 5;
    uint16 public hubChainId = 10002;
    string public utilDescription = "test1";

    function _createMockUser(uint256 privateKeySeed) internal pure returns (address) {
        return vm.addr(privateKeySeed);
    }

    function _createMockUserWithVotingPower(uint256 privateKeySeed, VHMToken _voteToken) internal returns (address) {
        //mock account with voting power
        address someUser = _createMockUser(privateKeySeed);
        voteToken.transfer(someUser, 1 ether);
        vm.startPrank(someUser);
        _voteToken.delegate(someUser);
        vm.stopPrank();
        return someUser;
    }

    function _createBasicProposal() internal returns (uint256) {
        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(this), 1 ether));
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(voteToken);
        calldatas[0] = encodedCall;

        uint256 proposalId = governanceContract.crossChainPropose(targets, values, calldatas, "");
        _createProposalOnSpoke(proposalId);
        return proposalId;
    }

    function _createProposalOnSpoke() internal returns (uint256) {
        return _createProposalOnSpoke(1);
    }

    function _createProposalOnSpoke(uint256 proposalId) internal returns (uint256) {
        bytes memory message = abi.encode(
            0, // Function selector "0" for destination contract
            proposalId,
            block.timestamp // Encoding the proposal start
        );
        bytes memory payload = abi.encode(
            address(daoSpokeContract),
            spokeChainId,
            address(governanceContract),
            message
        );
        IWormhole.VM memory mockResult = _createMessageWithPayload(payload);

        _callReceiveMessageOnSpokeWithMock(mockResult);
        return proposalId;
    }

    function _callReceiveMessageOnSpokeWithMock(IWormhole.VM memory result) internal {
        vm.mockCall(
            wormholeMockAddress,
            abi.encodeWithSelector(IWormhole.parseAndVerifyVM.selector),
            abi.encode(result, true, "test")
        );
        bytes[] memory vaas = new bytes[](0);
        vm.startPrank(wormholeMockAddress);
        daoSpokeContract.receiveWormholeMessages(result.payload, vaas, result.emitterAddress, result.emitterChainId, result.hash);
        vm.stopPrank();
    }

    function _callReceiveMessageOnHubWithMock(IWormhole.VM memory result) internal {
        bytes[] memory vaas = new bytes[](0);
        vm.startPrank(wormholeMockAddress);
        governanceContract.receiveWormholeMessages(result.payload, vaas, result.emitterAddress, result.emitterChainId, result.hash);
        vm.stopPrank();
    }

    function _createMessageWithPayload(bytes memory payload, uint16 emitterChainId, address emitterAddress) internal pure returns (IWormhole.VM memory) {
        IWormhole.Signature[] memory signatures = new IWormhole.Signature[](0);
        return IWormhole.VM(
            0, //version
            0, //timestamp
            0, //nonce
            emitterChainId, //emitterChainId
            bytes32(uint256(uint160(address(emitterAddress)))), //emitterAddress
            0, //sequence
            200, //consistencyLevel
            payload,
            0, //guardianSetIndex
            signatures,
            keccak256(payload)//hash
        );
    }

    function _collectVotesFromSpoke(uint256 proposalId) internal {
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
            hubChainId,
            address(daoSpokeContract),
            message
        );
        _callReceiveMessageOnHubWithMock(_createMessageWithPayload(payload, spokeChainId, address(daoSpokeContract)));
    }

    function _createMessageWithPayload(bytes memory payload) internal view returns (IWormhole.VM memory) {
        return _createMessageWithPayload(payload, hubChainId, address(governanceContract));
    }

    function _getHashToSignProposal(uint256 proposalId, uint8 support) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19\x01",
                keccak256(abi.encode(keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ), keccak256(bytes("MetaHumanGovernor")), keccak256(bytes("1")), block.chainid, address(governanceContract))),
                keccak256(abi.encode(governanceContract.BALLOT_TYPEHASH(), proposalId, support))));
    }

    function _getHashToSignProposalWithReasonAndParams(uint256 proposalId, uint8 support, string memory reason, bytes memory params) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19\x01",
                keccak256(abi.encode(keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ), keccak256(bytes("MetaHumanGovernor")), keccak256(bytes("1")), block.chainid, address(governanceContract))),
                keccak256(abi.encode(governanceContract.EXTENDED_BALLOT_TYPEHASH(), proposalId, support, keccak256(bytes(reason)), keccak256(params)))));
    }
}
